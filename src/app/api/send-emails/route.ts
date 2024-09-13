import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { promises as fs } from "fs";

interface EmailConfig {
  hiringManagerEmail: string;
  jobTitle: string;
  hiringManager: string;
  companyName: string;
}

const hardData = {
  industry: ["Software Developement & Engineering", "DevOps"],
  skills: [
    "MERN & MEAN stack, including AWS & Firebase",
    "React.js & Next.js, using multiple UI kits and also with Tailwind CSS & pure CSS",
    "Node.js and Express.js, creating APIs, also implementation of GoLang to create robust Backend, including cloud services like AWS & Firebase",
    "Docker & Kubernetes, also using GitHub Fastlane to implement CI/CD"
  ],
};
var industry: string= hardData.industry[0],
  skills: string = hardData.skills[0];

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

      // Processing the email
      await transporter.sendMail({
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
    }
    return NextResponse.json(
      { message: "Emails sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to send emails:", error);
    return NextResponse.json(
      { message: "Failed to send emails" },
      { status: 500 }
    );
  }
}
