import { generateSalt, hashPassword } from './passwordUtils';
import * as fs from 'fs';
import * as path from 'path';

// Function to generate credentials
export function generateCredentials(password: string) {
    const salt = generateSalt();
    const hash = hashPassword(password, salt);
    return { salt, hash };
}

// Function to update .env file
export function updateEnvFile(hash: string, salt: string) {
    const envPath = path.resolve(process.cwd(), '.env.local');
    let envContent = '';

    // Read existing .env file if it exists
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Update or add SMTP_PASSWORD_HASH and SMTP_PASSWORD_SALT
    const updatedContent = envContent
        .replace(/^SMTP_PASSWORD_HASH=.*$/m, `SMTP_PASSWORD_HASH=${hash}`)
        .replace(/^SMTP_PASSWORD_SALT=.*$/m, `SMTP_PASSWORD_SALT=${salt}`);

    // If the variables weren't present, add them
    if (!updatedContent.includes('SMTP_PASSWORD_HASH')) {
        envContent += `\nSMTP_PASSWORD_HASH=${hash}`;
    }
    if (!updatedContent.includes('SMTP_PASSWORD_SALT')) {
        envContent += `\nSMTP_PASSWORD_SALT=${salt}`;
    }

    // Write the updated content back to the .env file
    fs.writeFileSync(envPath, updatedContent);
    console.log('.env.local file updated successfully.');
}