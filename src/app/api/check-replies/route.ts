import dotenv from "dotenv";
import path from "path";
import { promises as fs } from "fs";
import { google, sheets_v4, gmail_v1 } from "googleapis";
import { NextResponse } from "next/server";

const gsheetsJSON = path.join(
  process.cwd(),
  "src/app/emailsender-gsheets.json"
);

var noReplies: number = 0;
var isDuplicate: boolean = false;

interface EmailConfig {
  dateChecked?: string;
  dateSent: string;
  name?: string;
  to: string;
  jobTitle?: string;
  companyName: string;
  gmailLink: string;
  threadId: string;
}

interface IsReply {
  hasReply: boolean;
  replyId: string;
  gmailLink: string;
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

async function logIntoSheets(reply: EmailConfig, isReferral: boolean) {
  try {
    isDuplicate = false;
    noReplies = 0;
    const dataFromSheet2: EmailConfig[] = await readSentEmailsFromSheets(
      false,
      isReferral
    );
    dataFromSheet2.map((data) => {
      if (data.threadId === reply.threadId) isDuplicate = true;
    });

    if (isDuplicate) return;

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
            reply.dateSent,
            reply.to,
            reply.name,
            reply.companyName,
            reply.gmailLink,
            reply.threadId,
          ],
        ]
      : [
          [
            `${formattedDate} - ${timeString}`,
            reply.dateSent,
            reply.to,
            reply.jobTitle,
            reply.companyName,
            reply.gmailLink,
            reply.threadId,
          ],
        ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: isReferral ? "Referrals_Recieved!A:G" : "Replies_Recieved!A:G",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    } as sheets_v4.Params$Resource$Spreadsheets$Values$Append);
    noReplies++;
  } catch (error) {
    console.error(error);
  }
}

async function readSentEmailsFromSheets(
  isAppliedSheets: boolean,
  isReferral: boolean
): Promise<EmailConfig[]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: isReferral
      ? isAppliedSheets
        ? "Referrals_Sent!A:F"
        : "Referrals_Recieved!A:G"
      : isAppliedSheets
      ? "Applications_Sent!A:F"
      : "Replies_Recieved!A:G",
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    throw new Error("No data found in the sheet.");
  }
  if (isReferral) {
    if (isAppliedSheets)
      return rows.map((row) => ({
        dateSent: row[0],
        to: row[1],
        name: row[2],
        companyName: row[3],
        gmailLink: row[4],
        threadId: row[5],
      }));
    else
      return rows.map((row) => ({
        dateChecked: row[0],
        dateSent: row[1],
        to: row[2],
        name: row[3],
        companyName: row[4],
        gmailLink: row[5],
        threadId: row[6],
      }));
  } else {
    if (isAppliedSheets)
      return rows.map((row) => ({
        dateSent: row[0],
        to: row[1],
        jobTitle: row[2],
        companyName: row[3],
        gmailLink: row[4],
        threadId: row[5],
      }));
    else
      return rows.map((row) => ({
        dateChecked: row[0],
        dateSent: row[1],
        to: row[2],
        jobTitle: row[3],
        companyName: row[4],
        gmailLink: row[5],
        threadId: row[6],
      }));
  }
}

async function checkForReplies(threadId: string): Promise<boolean> {
  try {
    const response = await gmail.users.threads.get({
      userId: "me",
      id: threadId,
    });

    const messages = response.data.messages;
    if (!messages || messages.length <= 1) {
      return false; // No replies if there's only one message (the original email)
    }

    // Check if any message other than the first one is from a different sender
    const originalSender = messages[0].payload?.headers?.find(
      (header) => header.name?.toLowerCase() === "from"
    )?.value;

    for (let i = 1; i < messages.length; i++) {
      const sender = messages[i].payload?.headers?.find(
        (header) => header.name?.toLowerCase() === "from"
      )?.value;

      if (sender && originalSender && sender !== originalSender) {
        return true; // Found a reply from a different sender
      }
    }

    return false; // No replies found
  } catch (error) {
    console.error(`Error checking replies for thread ${threadId}:`, error);
    return false; // Assume no reply in case of error
  }
}

export async function GET(req: Request) {
  dotenv.config({ path: ".env.local" });
  var isReferral: boolean = false;

  try {
    for (let i = 0; i < 2; i++) {
      const replies: EmailConfig[] = await readSentEmailsFromSheets(
        true,
        isReferral
      );
      await Promise.all(
        replies.map(async (email: EmailConfig) => {
          const hasReply: boolean = await checkForReplies(email.threadId);
          if (hasReply) await logIntoSheets(email, isReferral);
        })
      );
      isReferral = true;
    }

    if (noReplies > 0)
      return NextResponse.json(
        {
          message: `${noReplies} Replies logged in Sheet Succesfully`,
        },
        { status: 200 }
      );
    else
      return NextResponse.json(
        { message: "Replies Checked and No Replies found" },
        { status: 200 }
      );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to check replies",
        error: error,
        noReplies: noReplies,
      },
      { status: 500 }
    );
  }
}
