import { NextResponse } from "next/server";
import { EmailProcessor } from "../../emailProcessor";
import { google, sheets_v4 } from "googleapis";
import dotenv from "dotenv";
import path from "path";

const gsheetsJSON = path.join(
  process.cwd(),
  "src/app/emailsender-gsheets.json"
);
const auth = new google.auth.GoogleAuth({
  keyFile: gsheetsJSON,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

async function logIntoSheets(bounces: { bouncedEmail: string }[]) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Job_Sheet!B:B",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return;

    for (const bounce of bounces) {
      const rowIndex = rows.findIndex((row) => row[0] === bounce.bouncedEmail);
      if (rowIndex !== -1) {
        await updateRowColor(rowIndex + 1); // +1 because sheets are 1-indexed
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function updateRowColor(rowIndex: number): Promise<void> {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [
        {
          updateCells: {
            range: {
              sheetId: 0,
              startRowIndex: rowIndex - 1,
              endRowIndex: rowIndex,
            },
            rows: [
              {
                values: [
                  {
                    userEnteredFormat: {
                      backgroundColor: { red: 1, green: 0, blue: 0 },
                      textFormat: {
                        foregroundColor: { red: 1, green: 1, blue: 1 },
                      },
                    },
                  },
                ],
              },
            ],
            fields: "userEnteredFormat(backgroundColor,textFormat)",
          },
        },
      ],
    },
  });
}

export async function GET(req: Request) {
  dotenv.config({ path: ".env.local" });

  try {
    const emailProcessor = new EmailProcessor({
      user: process.env.SMTP_USER!,
      password: process.env.SMTP_GMAIL_PASS!,
      host: process.env.IMAP_HOST,
      port: 993,
      tls: true,
    });

    const bounces = await emailProcessor.processEmails();

    await logIntoSheets(bounces);

    return NextResponse.json(
      { message: `Processed ${bounces.length} bounces` },
      { status: 200 }
    );
    // return NextResponse.json({ bounces: bounces }, { status: 200 });
  } catch (error) {
    console.error("Error processing bounces:", error);
    return NextResponse.json(
      {
        message: "Error processing bounces",
        error: error,
      },
      { status: 500 }
    );
  }
}
