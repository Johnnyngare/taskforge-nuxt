import nodemailer from "nodemailer";
import { useRuntimeConfig } from '#imports';

export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  // Access the runtime config within the function
  const config = useRuntimeConfig();
  
  // Use Nuxt's built-in process.dev flag to determine the environment
  const isDev = process.dev;

  // Conditionally select the correct configuration from runtimeConfig
  const transporterConfig = {
    host: isDev ? config.email.mailtrapHost : config.email.gmailHost,
    port: isDev ? config.email.mailtrapPort : config.email.gmailPort,
    secure: false, // Typically false for port 587
    auth: {
      user: isDev ? config.email.mailtrapUser : config.email.gmailUser,
      pass: isDev ? config.email.mailtrapPass : config.email.gmailPass,
    },
  };

  const transporter = nodemailer.createTransport(transporterConfig);

  // Send the email using the sender info from the runtime config
  await transporter.sendMail({
    from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
    to,
    subject,
    text,
    html,
  });
}

// This helper function does not need any changes
export function getTaskAssignmentEmailHtml(
  assignedUserName: string,
  taskTitle: string,
  dashboardUrl: string,
  assignedBy: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>New Task Assignment</h2>
      <p>Hello <strong>${assignedUserName}</strong>,</p>
      <p>You have been assigned a new task: <strong>${taskTitle}</strong>.</p>
      <p>Assigned by: <strong>${assignedBy}</strong></p>
      <p>Please log in to your <a href="${dashboardUrl}" target="_blank">Taskforge Dashboard</a> to view the details.</p>
      <p>Thank you,<br/>Taskforge Team</p>
    </div>
  `;
}