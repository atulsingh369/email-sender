import { NextResponse } from "next/server";
import { google } from "googleapis";
import dotenv from "dotenv";
import path from "path";

const gsheetsJSON = path.join(
  process.cwd(),
  "src/app/emailsender-gsheets.json"
);
dotenv.config({ path: ".env.local" });

export async function POST(request: Request) {
  const { jobUrl, status } = await request.json();

  if (!jobUrl || !status) {
    return NextResponse.json(
      { error: "jobUrl and status are required" },
      { status: 400 }
    );
  }

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: gsheetsJSON,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Find the row with the matching job URL
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet3!A:F",
    });

    const rows = response.data.values;
    if (!rows) {
      return NextResponse.json(
        { error: "No data found in the sheet" },
        { status: 404 }
      );
    }

    const rowIndex = rows.findIndex((row) => row[4] === jobUrl);
    if (rowIndex === -1) {
      return NextResponse.json(
        { error: "Job not found in the sheet" },
        { status: 404 }
      );
    }

    // Update the status
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Sheet3!G${rowIndex + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[status]],
      },
    });

    return NextResponse.json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Error updating application status:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the application status" },
      { status: 500 }
    );
  }
}
