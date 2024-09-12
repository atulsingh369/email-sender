import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { verifyPassword } from '../../passwordUtils';
import { generateCredentials, updateEnvFile } from '@/app/generate-smtp-credentials';
import dotenv from 'dotenv';

interface EmailConfig {
    to: string;
    subject: string;
    text: string;
}

export async function POST(request: Request) {
    dotenv.config({ path: '.env.local' });
    const { emailConfigs }: { emailConfigs: EmailConfig[]} = await request.json();

    if (!Array.isArray(emailConfigs) || emailConfigs.length === 0) {
        return NextResponse.json({ message: 'Invalid email configurations' }, { status: 400 });
    }

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
                to: config.to,
                subject: config.subject,
                text: config.text,
            });
        }
        return NextResponse.json({ message: 'Emails sent successfully' }, { status: 200 });
    } catch (error) {
        console.error('Failed to send emails:', error);
        return NextResponse.json({ message: 'Failed to send emails' }, { status: 500 });
    }
}