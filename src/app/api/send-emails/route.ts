import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { promises as fs } from "fs";
import { google, sheets_v4, gmail_v1 } from "googleapis";
import { NextResponse } from "next/server";

interface EmailConfig {
  hiringManagerEmail: string;
  jobTitle: string;
  hiringManager: string;
  companyName: string;
  seniorURL?: string;
}

interface IDs {
  gmailLink: string;
  threadId: string;
}

const gsheetsJSON = path.join(
  process.cwd(),
  "src/app/emailsender-gsheets.json"
);

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

const hardData = {
  industry: ["Software Developement & Engineering", "DevOps"],
  skills: [
    "MERN & MEAN stack, including AWS & Firebase",
    "React.js & Next.js, using multiple UI kits and also with Tailwind CSS & pure CSS",
    "Node.js and Express.js, creating APIs, also implementation of GoLang to create robust Backend, including cloud services like AWS & Firebase",
    "Docker & Kubernetes, also using GitHub Fastlane to implement CI/CD",
  ],
};

var industry: string = hardData.industry[0],
  skills: string = hardData.skills[0];

const initVariable = async (config: EmailConfig) => {
  if (
    config.jobTitle === "Software Engineer" ||
    config.jobTitle === "Software Engineer Intern" ||
    config.jobTitle === "Senior Software Engineer" ||
    config.jobTitle === "Senior Software Engineer Intern" ||
    config.jobTitle === "Software Developer" ||
    config.jobTitle === "Software Developer Intern" ||
    config.jobTitle === "Senior Software Developer" ||
    config.jobTitle === "Senior Software Developer Intern" ||
    config.jobTitle === "Full Stack Developer" ||
    config.jobTitle === "Full Stack Developer Intern" ||
    config.jobTitle === "Senior Full Stack Developer" ||
    config.jobTitle === "Senior Full Stack Developer Intern" ||
    config.jobTitle === "Software Developemnet Engineer"
  ) {
    industry = hardData.industry[0];
    skills = hardData.skills[0];
  } else if (
    config.jobTitle === "Frontend Developer" ||
    config.jobTitle === "Frontend Developer Intern" ||
    config.jobTitle === "Senior Frontend Developer Intern" ||
    config.jobTitle === "Senior Frontend Developer" ||
    config.jobTitle === "React Developer" ||
    config.jobTitle === "React Developer Intern" ||
    config.jobTitle === "Senior React Developer Intern" ||
    config.jobTitle === "Senior React Developer" ||
    config.jobTitle === "React.js Developer" ||
    config.jobTitle === "React.js Developer Intern" ||
    config.jobTitle === "Senior React.js Developer Intern" ||
    config.jobTitle === "Senior React.js Developer" ||
    config.jobTitle === "React js Developer" ||
    config.jobTitle === "React js Developer Intern" ||
    config.jobTitle === "Senior React js Developer Intern" ||
    config.jobTitle === "Senior React js Developer" ||
    config.jobTitle === "Next.js Developer" ||
    config.jobTitle === "Next.js Developer Intern" ||
    config.jobTitle === "Senior Next.js Developer Intern" ||
    config.jobTitle === "Senior Next.js Developer" ||
    config.jobTitle === "Frontend Engineer" ||
    config.jobTitle === "Frontend Engineer Intern" ||
    config.jobTitle === "Senior Frontend Engineer" ||
    config.jobTitle === "Senior Frontend Engineer Intern"
  ) {
    industry = hardData.industry[0];
    skills = hardData.skills[1];
  } else if (
    config.jobTitle === "Backend Engineer" ||
    config.jobTitle === "Backend Engineer Intern" ||
    config.jobTitle === "Senior Backend Engineer" ||
    config.jobTitle === "Senior Backend Engineer Intern" ||
    config.jobTitle === "Backend Developer" ||
    config.jobTitle === "Backend Developer Intern" ||
    config.jobTitle === "Senior Backend Developer Intern" ||
    config.jobTitle === "Senior Backend Developer"
  ) {
    industry = hardData.industry[0];
    skills = hardData.skills[2];
  } else if (
    config.jobTitle === "DevOps Engineer" ||
    config.jobTitle === "Senior DevOps Engineer" ||
    config.jobTitle === "DevOps Engineer Intern" ||
    config.jobTitle === "Senior DevOps Engineer Intern"
  ) {
    industry = hardData.industry[1];
    skills = hardData.skills[3];
  }
};

const textContent = (
  hiringManager: string,
  jobTitle: string,
  industry: string,
  skills: string,
  companyName: string,
  index: number,
  isReferral: boolean,
  seniorURL: string
): string => {
  const text1: string = `Hi ${hiringManager},\n\nI'm eager to become your next ${jobTitle}!\n\nI recently came across the ${jobTitle} opening at ${companyName} on LinkedIn and felt compelled to reach out. With my ${process.env.YOE} years of experience in ${industry}, coupled with my skills in ${skills}, I beleive I'd be an excellent fit for your team. \n\nPlease find my resume and portfolio attached for your review. I'm really looking forward to discusssing how I can bring fresh ideas to your team, particularly in ${industry}.\n\n Excited about the possibility of working together!\n\n\Best, \n\nAtul Kumar Singh\nSoftware Developer\nhttps://www.linkedin.com/in/atulsingh369\n\nVisit my LinkTree\nhttps://linktr.ee/atulsingh369`;
  const text2: string = `Dear ${hiringManager},\n\nI hope this message finds you well. I am writing to express my interest in the ${jobTitle} position at ${companyName} that I discovered through linkedin.\n\nWith ${process.env.YOE} years of experience in ${industry}, I am confident in my ability to contribute effectively to your team and believe my skills in ${skills} align well with the requirements of the role.\n\nThank you for considering my application. I have attached my resume for your review. I would welcome the opportunity to discuss how my background, skills, and passion for ${industry} make me a strong candidate for this position.\n\nI look forward to hearing from you soon.\n\nBest regards,\n\nAtul Kumar Singh\nSoftware Developer\nhttps://www.linkedin.com/in/atulsingh369\n\nVisit my LinkTree\nhttps://linktr.ee/atulsingh369`;

  const referralText: string = `Dear [Name],\n\nI hope this email finds you well. My name is Atul Kumar Singh, and I'm a Software Developer with experience in full-stack development, particularly in web technologies and agile methodologies. I came across your profile on [LinkedIn/Company Website] and was impressed by your work at [Company Name].\n\nI'm reaching out because I'm very interested in joining [Company Name] as a Software Developer. Your insights into the company culture and work environment would be invaluable to me. I was wondering if you might have a few minutes to chat about your experience at [Company Name] and any potential opportunities that might be a good fit for someone with my background?.\n\nFor context, here's a brief overview of my experience:\n\n    • 1+ year of full-stack development experience.\n    • Proficient in Angular, React, Node.js, and cloud platforms like AWS\n    • Implemented Agile methodologies, improving team efficiency by 80%\n    • Developed projects that increased productivity by over 100%\n\nI've attached my resume for your reference. If you feel there might be a suitable role for me at [Company Name], I would be incredibly grateful if you could refer me or point me in the right direction.\n\nThank you for your time and consideration. I look forward to the possibility of connecting with you.\n\nBest regards,\n\nAtul Kumar Singh\nSoftware Developer\n+91 7518299883\nhttps://www.linkedin.com/in/atulsingh369\n\nVisit my LinkTree\nhttps://linktr.ee/atulsingh369`;

  const textSamples: string[] = [text1, text2];
  if (isReferral)
    return referralText
      .replace("[Name]", hiringManager)
      .replace("[Name]", hiringManager)
      .replace("[Company Name]", companyName)
      .replace("[Company Name]", companyName)
      .replace("[Company Name]", companyName)
      .replace("[Company Name]", companyName)
      .replace("[Company Name]", companyName)
      .replace("[Company Name]", companyName)
      .replace("[LinkedIn/Company Website]", seniorURL)
      .replace("[LinkedIn/Company Website]", seniorURL);
  return textSamples[index];
};

const subject = (
  jobTitle: string,
  companyName: string,
  isReferral: boolean
): string => {
  if (isReferral) {
    return `Seeking Your Advice: Software Developer Opportunities at ${companyName}`;
  } else {
    return `Application for ${jobTitle} Position in ${companyName}`;
  }
};

async function constructGmailLink(
  to: string,
  jobTitle: string,
  isReferral: boolean,
  companyName: string
): Promise<IDs> {
  const gmail: gmail_v1.Gmail = google.gmail({
    version: "v1",
    auth: oauth2Client,
  });

  let gLink: string = "N/A";
  let theradId: string = "N/A";
  const query: string = subject(jobTitle, companyName, isReferral);

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

async function logIntoSheets(
  gmailLink: string,
  threadId: string,
  config: EmailConfig,
  isReferral: boolean
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

    const values = isReferral
      ? [
          [
            `${formattedDate} - ${timeString}`,
            config.hiringManagerEmail,
            config.hiringManager,
            config.companyName,
            gmailLink,
            threadId,
          ],
        ]
      : [
          [
            `${formattedDate} - ${timeString}`,
            config.hiringManagerEmail,
            config.jobTitle,
            config.companyName,
            gmailLink,
            threadId,
          ],
        ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: isReferral ? "Referrals_Sent!A:F" : "Applications_Sent!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    } as sheets_v4.Params$Resource$Spreadsheets$Values$Append);
  } catch (error) {
    console.error(error);
  }
}

export async function POST(request: Request) {
  dotenv.config({ path: ".env.local" });
  const {
    emailConfigs,
    index,
    isReferral,
  }: { emailConfigs: EmailConfig[]; index: number; isReferral: boolean } =
    await request.json();

  if (!Array.isArray(emailConfigs) || emailConfigs.length === 0) {
    return NextResponse.json(
      { message: "Invalid email configurations" },
      { status: 400 }
    );
  }

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

  const attachments = isReferral
    ? [
        {
          filename: path.basename(resumePath),
          content: resume,
        },
      ]
    : [
        {
          filename: path.basename(resumePath),
          content: resume,
        },
        {
          filename: path.basename(coverLetterPath),
          content: coverLetter,
        },
      ];

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
    for (const config of emailConfigs) {
      // Proccessing other values like industry and skills
      await initVariable(config);
      const seniorURL: string = isReferral
        ? config.seniorURL
          ? config.seniorURL
          : ""
        : "";

      // Processing the email
      const info = await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: config.hiringManagerEmail,
        subject: subject(config.jobTitle, config.companyName, isReferral),
        text: textContent(
          config.hiringManager,
          config.jobTitle,
          industry,
          skills,
          config.companyName,
          index,
          isReferral,
          seniorURL
        ),
        attachments: [...attachments],
      });

      // Wait for a short period to ensure the message is available in Gmail
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Proccessing GMail Link
      await constructGmailLink(
        config.hiringManagerEmail,
        config.jobTitle,
        isReferral,
        config.companyName
      ).then(async (links) => {
        // Processing Logging in Sheets
        await logIntoSheets(
          links.gmailLink,
          links.threadId,
          config,
          isReferral
        );
      });
    }
    // return NextResponse.json({ text: text }, { status: 200 });
    return NextResponse.json(
      { message: "Emails sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    // console.error("Failed to send emails:", error);
    return NextResponse.json(
      { message: "Failed to send emails", error: error },
      { status: 500 }
    );
  }
}
