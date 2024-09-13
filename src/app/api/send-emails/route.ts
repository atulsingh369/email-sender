import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { promises as fs } from 'fs';

interface EmailConfig {
    hiringManagerEmail: string;
    jobTitle: string;
    hiringManager: string;
    companyName: string;
    YOE: string;
    industry1: string;
    industry2: string;
    skills: string;
}

export async function POST(request: Request) {
    dotenv.config({ path: '.env.local' });
    const { emailConfigs }: { emailConfigs: EmailConfig[] } = await request.json();

    if (!Array.isArray(emailConfigs) || emailConfigs.length === 0) {
        return NextResponse.json({ message: 'Invalid email configurations' }, { status: 400 });
    }

    const resumePath = 'src/app/Documents/Atul Kumar Singh_Software Developer.pdf';
    const coverLetterPath = 'src/app/Documents/cover_letter.pdf'

    const resume = await fs.readFile(resumePath);
    const coverLetter = await fs.readFile(coverLetterPath);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
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
            await transporter.sendMail({
                from: process.env.FROM_EMAIL,
                to: config.hiringManagerEmail,
                subject: `Application for ${config.jobTitle} Position`,
                text: `Dear ${config.hiringManager},\n\nI hope this message finds you well. I am writing to express my interest in the ${config.jobTitle} position at ${config.companyName} that I discovered through linkedin.\n\nWith ${config.YOE} years of experience in ${config.industry1}, I am confident in my ability to contribute effectively to your team and believe my skills in ${config.skills} align well with the requirements of the role.\n\nThank you for considering my application. I have attached my resume for your review. I would welcome the opportunity to discuss how my background, skills, and passion for ${config.industry2} make me a strong candidate for this position.\n\nI look forward to hearing from you soon.\n\nBest regards,\n\nAtul Kumar Singh\nSoftware Developer\nhttps://www.linkedin.com/in/atulsingh369\n\nVisit my LinkTree\nhttps://linktr.ee/atulsingh369`,
                attachments: [
                    {
                        filename: path.basename(resumePath),
                        content: resume,
                    },
                    {
                        filename: path.basename(coverLetterPath),
                        content: coverLetter,
                    }
                ]
            });
        }
        return NextResponse.json({ message: 'Emails sent successfully' }, { status: 200 });
    } catch (error) {
        console.error('Failed to send emails:', error);
        return NextResponse.json({ message: 'Failed to send emails' }, { status: 500 });
    }
}