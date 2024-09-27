import { NextResponse } from "next/server";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import * as cheerio from 'cheerio';
import { google, sheets_v4 } from "googleapis";
import { RateLimiter } from "limiter";
import { link } from "fs";
import puppeteer from "puppeteer";

const gsheetsJSON = path.join(
  process.cwd(),
  "src/app/emailsender-gsheets.json"
);
dotenv.config({ path: ".env.local" });

interface jobs {
  title: string;
  company: string;
  location: string;
  url: string | undefined;
  skills: string[];
}

// Rate limiters
const githubLimiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: "minute",
});
const linkedinLimiter = new RateLimiter({
  tokensPerInterval: 5,
  interval: "minute",
});
const indeedLimiter = new RateLimiter({
  tokensPerInterval: 5,
  interval: "minute",
});
const naukriLimiter = new RateLimiter({
  tokensPerInterval: 5,
  interval: "minute",
});

async function searchGitHubJobs(query: string, page: number = 1) {
  await githubLimiter.removeTokens(1);
  const response = await axios.get(
    `https://www.github.careers/careers-home/jobs?keywords=${query}&page=${page}`
  );
  // return response.data.map((job: any) => ({
  //   source: "GitHub",
  //   title: job.title,
  //   company: job.company,
  //   location: job.location,
  //   url: job.url,
  //   skills:
  //     job.description.match(
  //       /\b(?:javascript|python|react|node|typescript)\b/gi
  //     ) || [],
  // }));
  return response.data();
}

async function searchLinkedInJobs(query: string, page: number = 1) {
  await linkedinLimiter.removeTokens(1);
  const response = await axios.get(
    `https://www.linkedin.com/jobs/search/?keywords=${query}&start=${
      (page - 1) * 25
    }`
  );
  const $ = cheerio.load(response.data);
  const jobs: {
    source: string;
    title: string;
    company: string;
    location: string;
    url: string | undefined;
    skills: never[];
  }[] = [];

  $(".job-search-card").each((i, el) => {
    jobs.push({
      source: "LinkedIn",
      title: $(el).find(".job-search-card__title").text().trim(),
      company: $(el).find(".job-search-card__subtitle").text().trim(),
      location: $(el).find(".job-search-card__location").text().trim(),
      url: $(el).find("a.job-search-card__title").attr("href"),
      skills: [], // We'd need to visit each job page to extract skills
    });
  });

  return jobs;
}

async function searchLinkedIn(query: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to LinkedIn jobs page
    await page.goto(
      `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
        query
      )}`
    );

    // Wait for job listings to load
    await page.waitForSelector(".jobs-search__results-list");

    // Extract job information
    const jobs = await page.evaluate(() => {
      const jobListings = document.querySelectorAll(
        ".jobs-search__results-list > li"
      );
      return Array.from(jobListings).map((job) => {
        const titleElement = job.querySelector(".base-search-card__title");
        const companyElement = job.querySelector(".base-search-card__subtitle");
        const linkElement = job.querySelector(".base-card__full-link");

        return {
          title: titleElement ? titleElement.textContent?.trim() : "",
          company: companyElement ? companyElement.textContent?.trim() : "",
          link: linkElement ? linkElement.getAttribute("href")?.trim() : "",
        };
      });
    });

    return jobs;
  } catch (error) {
    console.error("Error during LinkedIn job search:", error);
    return [];
  } finally {
    await browser.close();
  }
}

async function searchIndeedJobs(query: string, page: number = 1) {
  await indeedLimiter.removeTokens(1);
  const response = await axios.get(
    `https://www.indeed.com/jobs?q=${query}&start=${(page - 1) * 10}`
  );
  const $ = cheerio.load(response.data);
  const jobs: {
    source: string;
    title: string;
    company: string;
    location: string;
    url: string;
    skills: never[];
  }[] = [];

  $(".job_seen_beacon").each((i, el) => {
    jobs.push({
      source: "Indeed",
      title: $(el).find(".jobTitle").text().trim(),
      company: $(el).find(".companyName").text().trim(),
      location: $(el).find(".companyLocation").text().trim(),
      url: "https://www.indeed.com" + $(el).find(".jcs-JobTitle").attr("href"),
      skills: [], // We'd need to visit each job page to extract skills
    });
  });

  return jobs;
}

async function searchNaukriJobs(query: string, page: number = 1) {
  await naukriLimiter.removeTokens(1);
  const response = await axios.get(
    `https://www.naukri.com/${query}-jobs-${page}`
  );
  const $ = cheerio.load(response.data);
  const jobs: {
    source: string;
    title: string;
    company: string;
    location: string;
    url: string | undefined;
    skills: string[];
  }[] = [];

  $(".jobTuple").each((i, el) => {
    jobs.push({
      source: "Naukri",
      title: $(el).find(".title").text().trim(),
      company: $(el).find(".companyInfo").text().trim(),
      location: $(el).find(".location").text().trim(),
      url: $(el).find(".title").attr("href"),
      skills: $(el)
        .find(".tags li")
        .map((i, el) => $(el).text().trim())
        .get(),
    });
  });

  return jobs;
}

async function updateGoogleSheet(jobs: any[]) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: gsheetsJSON,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const values = jobs.map((job) => [
      job.source,
      job.title,
      job.company,
      job.location,
      job.url,
      job.skills.join(", "),
      "Not Applied", // Initial application status
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet3!A1", // Adjust as needed
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    } as sheets_v4.Params$Resource$Spreadsheets$Values$Append);
  } catch (error) {
    console.error(error);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const page = parseInt(searchParams.get("page") || "1", 10);

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  try {
    // const [
    //   githubJobs,
    //   //  linkedInJobs,
    //   //  indeedJobs,
    //   //  naukriJobs
    // ] = await Promise.all([
    //   searchGitHubJobs(query, page),
    //   // searchLinkedInJobs(query, page),
    //   // searchLinkedIn(query)
    //   // searchIndeedJobs(query, page),
    //   // searchNaukriJobs(query, page),
    // ]);

    await githubLimiter.removeTokens(1);
    const response = await axios.get(
      `https://www.github.careers/careers-home/jobs?keywords=${query}&page=${page}`
    );

    const allJobs: any[] = [
      // ...response.data,
      // ...linkedInJobs,
      // ...indeedJobs,
      // ...naukriJobs,
    ];

    return NextResponse.json({
      jobs: response,
      page: page,
      hasMore: allJobs.length > 0, // Simple way to check if there might be more results
    });
  } catch (error) {
    console.error("Error searching jobs:", error);
    return NextResponse.json(
      { message: "Error during LinkedIn job search", error: error },
      { status: 500 }
    );
  } finally {
    // await browser.close();
  }
}
