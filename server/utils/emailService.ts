// server/utils/emailService.ts - UPDATED for Mailtrap in dev
import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer'; // NEW: Import Nodemailer

const runtimeConfig = useRuntimeConfig(); // Access runtime config

// Set SendGrid API Key for production
if (process.env.NODE_ENV === 'production') {
    if (!runtimeConfig.private.sendgridApiKey) {
        console.error('SENDGRID_API_KEY is not set in production environment!');
    } else {
        sgMail.setApiKey(runtimeConfig.private.sendgridApiKey);
    }
}

// Nodemailer transporter for development (Mailtrap)
let devTransporter: nodemailer.Transporter | null = null;
if (process.env.NODE_ENV !== 'production') {
    // Check if Mailtrap creds are available
    if (runtimeConfig.private.mailtrapHost && runtimeConfig.private.mailtrapPort &&
        runtimeConfig.private.mailtrapUser && runtimeConfig.private.mailtrapPass) {
        devTransporter = nodemailer.createTransport({
            host: runtimeConfig.private.mailtrapHost,
            port: Number(runtimeConfig.private.mailtrapPort), // Ensure port is number
            auth: {
                user: runtimeConfig.private.mailtrapUser,
                pass: runtimeConfig.private.mailtrapPass,
            },
            // optional: allow self-signed certs for local dev (if needed, but usually not for Mailtrap)
            // tls: { rejectUnauthorized: false }
        });
        console.log('[EmailService] Mailtrap transporter configured for development.');
    } else {
        console.warn('[EmailService] Mailtrap credentials incomplete. Emails will NOT be sent in development.');
    }
}


export const sendEmail = async (options: { to: string; subject: string; html: string; text: string; from?: string }) => {
    const fromEmail = options.from || 'no-reply@taskforge.com'; // Default sender email

    if (process.env.NODE_ENV === 'production') {
        if (!runtimeConfig.private.sendgridApiKey) {
            console.error('[EmailService] Production email failed: SENDGRID_API_KEY is missing.');
            throw new Error('Email service not configured for production.');
        }
        await sgMail.send({ ...options, from: fromEmail });
        console.log(`[EmailService] Production email sent to ${options.to}`);
    } else {
        // Development email via Mailtrap
        if (devTransporter) {
            await devTransporter.sendMail({
                from: fromEmail,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
            });
            console.log(`[EmailService] Development email sent to ${options.to} via Mailtrap.`);
        } else {
            console.warn(`[EmailService] Skipping email to ${options.to} in development. Mailtrap not configured.`);
        }
    }
};

// Your existing getTaskAssignmentEmailHtml function
export const getTaskAssignmentEmailHtml = (
    recipientName: string,
    taskTitle: string,
    dashboardUrl: string,
    assignerName: string
) => {
    return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #059669;">Taskforge: New Task Assignment</h2>
      <p>Hello ${recipientName},</p>
      <p>You have been assigned a new task: <strong>"${taskTitle}"</strong> by ${assignerName}.</p>
      <p>Please log in to your Taskforge dashboard to view the details and start working on it.</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="${dashboardUrl}" style="display: inline-block; padding: 10px 20px; background-color: #059669; color: #ffffff; text-decoration: none; border-radius: 5px;">View Task in Dashboard</a>
      </p>
      <p>If you have any questions, please contact ${assignerName}.</p>
      <p>Thanks,<br/>The Taskforge Team</p>
      <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
      <p style="font-size: 0.8em; color: #777;">This email was sent by Taskforge. Please do not reply directly to this email.</p>
    </div>
    `;
};