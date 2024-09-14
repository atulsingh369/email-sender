import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { promises as fs } from "fs";
import { google, sheets_v4, gmail_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { NextResponse } from "next/server";

interface EmailConfig {
  hiringManagerEmail: string;
  jobTitle: string;
  hiringManager: string;
  companyName: string;
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
    config.jobTitle === "React.js Developer" ||
    config.jobTitle === "React.js Developer Intern" ||
    config.jobTitle === "Senior React.js Developer Intern" ||
    config.jobTitle === "Senior React.js Developer" ||
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

async function getAccessToken() {
  const { token } = await oauth2Client.getAccessToken();
  return token;
}

// async function checkForReplies(sent_message_id) {
//   try {
//     // Fetch the sent message to get its thread ID
//     const sent_message = await gmail.users.messages.get({
//       userId: 'me',
//       id: sent_message_id,
//     });
//     const threadId = sent_message.data.threadId;

//     // Fetch all messages in the thread
//     const thread = await gmail.users.threads.get({
//       userId: 'me',
//       id: threadId,
//     });

//     // Check if there are any messages in the thread other than the original sent message
//     if (thread.data.messages.length > 1) {
//       // Find the most recent message that isn't the original sent message
//       const reply = thread.data.messages
//         .filter(msg => msg.id !== sent_message_id)
//         .sort((a, b) => b.internalDate - a.internalDate)[0];

//       if (reply) {
//         return {
//           hasReply: true,
//           replyId: reply.id,
//           replyFrom: reply.payload.headers.find(h => h.name === 'From').value,
//           replyDate: new Date(parseInt(reply.internalDate)).toISOString(),
//         };
//       }
//     }

//     return { hasReply: false };
//   } catch (error) {
//     console.error('Error checking for replies:', error);
//     return { hasReply: false, error: error.message };
//   }
// }

async function constructGmailLink(
  to: string,
  jobTitle: string
): Promise<string> {
  const accessToken = await getAccessToken();
  // Get the Gmail thread ID
  // Get the Gmail thread ID
  const gmail: gmail_v1.Gmail = google.gmail({
    version: "v1",
    auth: oauth2Client,
  });

  let gLink: string = "N/A";

  // Search for the message using query parameters
  const searchResponse = await gmail.users.messages.list({
    userId: "me",
    q: `to:${to} subject:Application for ${jobTitle} Position`,
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
            gLink = `https://mail.google.com/mail/u/0/#inbox/${threadId}`;
          }
        });
  }
  return gLink;
}

async function logIntoSheets(
  messageId: string,
  gmailLink: string,
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
    const formatterTime = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const formattedTime = formatterTime.format(date);
    const formattedDate = formatter.format(date);

    const values = [
      [
        `${formattedDate} - ${formattedTime}`,
        config.hiringManagerEmail,
        config.jobTitle,
        config.companyName,
        gmailLink,
        messageId,
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    } as sheets_v4.Params$Resource$Spreadsheets$Values$Append);
  } catch (error) {
    console.error(error);
  }
}

export async function POST(request: Request) {
  dotenv.config({ path: ".env.local" });
  const { emailConfigs }: { emailConfigs: EmailConfig[] } =
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

      // Processing the email
      const info = await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: config.hiringManagerEmail,
        subject: `Application for ${config.jobTitle} Position`,
        text: `Dear ${config.hiringManager},\n\nI hope this message finds you well. I am writing to express my interest in the ${config.jobTitle} position at ${config.companyName} that I discovered through linkedin.\n\nWith ${process.env.YOE} years of experience in ${industry}, I am confident in my ability to contribute effectively to your team and believe my skills in ${skills} align well with the requirements of the role.\n\nThank you for considering my application. I have attached my resume for your review. I would welcome the opportunity to discuss how my background, skills, and passion for ${industry} make me a strong candidate for this position.\n\nI look forward to hearing from you soon.\n\nBest regards,\n\nAtul Kumar Singh\nSoftware Developer\nhttps://www.linkedin.com/in/atulsingh369\n\nVisit my LinkTree\nhttps://linktr.ee/atulsingh369`,
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
      await constructGmailLink(config.hiringManagerEmail, config.jobTitle).then(
        async (gmailLink) => {
          // Processing Logging in Sheets
          await logIntoSheets(info.messageId, gmailLink, config);
        }
      );
    }
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
