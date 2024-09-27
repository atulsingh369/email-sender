import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { promises as fs } from "fs";
import { google, sheets_v4, gmail_v1 } from "googleapis";
import { NextResponse } from "next/server";

const gsheetsJSON = path.join(
  process.cwd(),
  "src/app/emailsender-gsheets.json"
);

interface EmailConfig {
  name: string;
  companyName: string;
  email: string;
}

interface IDs {
  gmailLink: string;
  threadId: string;
}

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

// Set up OAuth2 client (you'll need to configure this with your credentials)
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const auth = new google.auth.GoogleAuth({
  keyFile: gsheetsJSON,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });
const gmail: gmail_v1.Gmail = google.gmail({
  version: "v1",
  auth: oauth2Client,
});

const textContent = (
  hiringManager: string,
  jobTitle: string,
  industry: string,
  skills: string,
  companyName: string,
  index: number
): string => {
  const text1: string = `Hi ${hiringManager},\n\nI'm eager to become your next ${jobTitle}!\n\nI recently came across the ${jobTitle} opening at ${companyName} on LinkedIn and felt compelled to reach out. With my ${process.env.YOE} years of experience in ${industry}, coupled with my skills in ${skills}, I beleive I'd be an excellent fit for your team. \n\nPlease find my resume and portfolio attached for your review. I'm really looking forward to discusssing how I can bring fresh ideas to your team, particularly in ${industry}.\n\n Excited about the possibility of working together!\n\n\Best, \n\nAtul Kumar Singh\nSoftware Developer\nhttps://www.linkedin.com/in/atulsingh369\n\nVisit my LinkTree\nhttps://linktr.ee/atulsingh369`;
  const text2: string = `Dear ${hiringManager},\n\nI hope this message finds you well. I am writing to express my interest in the ${jobTitle} position at ${companyName} that I discovered through linkedin.\n\nWith ${process.env.YOE} years of experience in ${industry}, I am confident in my ability to contribute effectively to your team and believe my skills in ${skills} align well with the requirements of the role.\n\nThank you for considering my application. I have attached my resume for your review. I would welcome the opportunity to discuss how my background, skills, and passion for ${industry} make me a strong candidate for this position.\n\nI look forward to hearing from you soon.\n\nBest regards,\n\nAtul Kumar Singh\nSoftware Developer\nhttps://www.linkedin.com/in/atulsingh369\n\nVisit my LinkTree\nhttps://linktr.ee/atulsingh369`;

  const textSamples: string[] = [text1, text2];

  return textSamples[index];
};

const subject = (jobTitle: string, companyName: string): string => {
  return `Application for ${jobTitle} Position`;
};

async function logIntoSheets(
  gmailLink: string,
  threadId: string,
  config: EmailConfig
) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: gsheetsJSON,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const date = new Date();
    date.setHours(date.getHours() + 5);
    date.setMinutes(date.getMinutes() + 30);
    const formatter = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const formattedDate = formatter.format(date);

    const timeString = date.toLocaleTimeString("en-US", {
      timeStyle: "short",
      hour12: true,
    });

    const values = [
      [
        `${formattedDate} - ${timeString}`,
        config.email,
        "Software Developer",
        config.companyName,
        gmailLink,
        threadId,
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Applications_Sent!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    } as sheets_v4.Params$Resource$Spreadsheets$Values$Append);
  } catch (error) {
    console.error(error);
  }
}

async function readEmailsFromSheets(): Promise<EmailConfig[]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Job_Sheet!A:A",
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    throw new Error("No data found in the sheet.");
  }
  // return rows.map((row) => ({
  //   name: 'row[0]',
  //   companyName: row[1],
  //   email: row[2],
  //   phn1: row[3],
  //   phn2: row[4],
  //   desg: row[5],
  //   loc: row[6],
  //   linkedInURL: row[7],
  // }));
  return rows.map((row) => ({
    name: "Hiring Team",
    email: row[0],
    companyName: "your esteemed Organization",
  }));
}

async function constructGmailLink(
  to: string,
  jobTitle: string,
  companyName: string
): Promise<IDs> {
  const gmail: gmail_v1.Gmail = google.gmail({
    version: "v1",
    auth: oauth2Client,
  });

  let gLink: string = "N/A";
  let theradId: string = "N/A";
  const query: string = subject(jobTitle, companyName);

  // Search for the message using query parameters
  const searchResponse = await gmail.users.messages.list({
    userId: "me",
    q: `to:${to} subject:${query}`,
    maxResults: 1,
  });
  if (searchResponse.data.messages && searchResponse.data.messages.length > 0) {
    const messageId = searchResponse.data.messages[0].id;
    if (messageId)
      await gmail.users.messages
        .get({
          userId: "me",
          id: messageId,
        })
        .then(async (message) => {
          if (message.data.threadId) {
            const threadId = message.data.threadId;
            theradId = message.data.threadId;
            gLink = `https://mail.google.com/mail/u/0/#inbox/${threadId}`;
          }
        });
  }
  return { gmailLink: gLink, threadId: theradId };
}

export async function POST(req: Request) {
  dotenv.config({ path: ".env.local" });

  const { index }: { index: number } = await req.json();

  const resumePath = path.join(
    process.cwd(),
    "src/app/Documents/Atul Kumar Singh_Software Developer.pdf"
  );
  const coverLetterPath = path.join(
    process.cwd(),
    "src/app/Documents/cover_letter.pdf"
  );

  const resume = await fs.readFile(resumePath);
  const coverLetter = await fs.readFile(coverLetterPath);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_GMAIL_PASS,
    },
    debug: true,
    logger: true,
  });

  try {
    const dataFromSheet: EmailConfig[] = await readEmailsFromSheets();

    for (const config of dataFromSheet) {
      // Processing the email

      // const companyName = config.email.split("@")[1];

      if (config.email && config.email !== "") {
        const info = await transporter.sendMail({
          from: process.env.FROM_EMAIL,
          to: config.email.toLowerCase(),
          subject: subject("Software Developer", config.companyName),
          text: textContent(
            config.name.trim(),
            "Software Developer",
            "Software Developement & Engineering",
            "MERN & MEAN stack, including Next.js and creating APIs, also implementation of GoLang to create robust Backend, including cloud services like AWS & Firebase",
            "your esteemed Organization",
            index
          ),
          attachments: [
            {
              filename: path.basename(resumePath),
              content: resume,
            },
            {
              filename: path.basename(coverLetterPath),
              content: coverLetter,
            },
          ],
        });

        // Wait for a short period to ensure the message is available in Gmail
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Proccessing GMail Link
        await constructGmailLink(
          config.email,
          "Software Developer",
          config.companyName
        ).then(async (links) => {
          // Processing Logging in Sheets
          await logIntoSheets(links.gmailLink, links.threadId, config);
        });
      }
    }

    return NextResponse.json(
      { message: "Emails sent successfully", data: dataFromSheet },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed scan and send mails",
        error: error,
      },
      { status: 500 }
    );
  }
}
