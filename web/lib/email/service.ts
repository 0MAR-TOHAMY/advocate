import { getEmailTransporter, fromEmail } from "./config";
import {
  getVerificationEmailTemplate,
  getPasswordResetEmailTemplate,
  getPasswordChangedEmailTemplate,
  getWelcomeEmailTemplate,
  getJoinRequestEmailTemplate,
  getJoinRequestStatusEmailTemplate,
  getTrialEndingEmailTemplate,
  getInvitationEmailTemplate,
  getFirmDeletionOtpTemplate,
  getPaymentFailedEmailTemplate,
  getStorageLimitWarningEmailTemplate,
  getSeatLimitReachedEmailTemplate,
  getEventAssignedEmailTemplate,
} from "./templates";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const transporter = getEmailTransporter();

    await transporter.sendMail({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`✅ Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${options.to}:`, error);
    return false;
  }
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationToken: string
): Promise<boolean> {
  const template = getVerificationEmailTemplate(name, verificationToken);

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<boolean> {
  const template = getPasswordResetEmailTemplate(name, resetToken);

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendPasswordChangedEmail(
  email: string,
  name: string
): Promise<boolean> {
  const template = getPasswordChangedEmailTemplate(name);

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<boolean> {
  const template = getWelcomeEmailTemplate(name);

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendJoinRequestEmail(
  email: string,
  adminName: string,
  requesterName: string,
  firmName: string
): Promise<boolean> {
  const template = getJoinRequestEmailTemplate(adminName, requesterName, firmName);
  return sendEmail({ to: email, ...template });
}

export async function sendJoinRequestStatusEmail(
  email: string,
  userName: string,
  firmName: string,
  status: "approved" | "rejected"
): Promise<boolean> {
  const template = getJoinRequestStatusEmailTemplate(userName, firmName, status);
  return sendEmail({ to: email, ...template });
}

export async function sendTrialEndingEmail(
  email: string,
  adminName: string,
  firmName: string,
  endDate: string,
  daysLeft: number
): Promise<boolean> {
  const template = getTrialEndingEmailTemplate(adminName, firmName, endDate, daysLeft);
  return sendEmail({ to: email, ...template });
}

export async function sendInvitationEmail(
  email: string,
  firmName: string,
  inviteLink: string
): Promise<boolean> {
  const template = getInvitationEmailTemplate(firmName, inviteLink);
  return sendEmail({ to: email, ...template });
}

export async function sendFirmDeletionOtpEmail(
  email: string,
  adminName: string,
  firmName: string,
  otp: string
): Promise<boolean> {
  const template = getFirmDeletionOtpTemplate(adminName, firmName, otp);
  return sendEmail({ to: email, ...template });
}

export async function sendPaymentFailedEmail(
  email: string,
  adminName: string,
  firmName: string,
  billingUrl: string
): Promise<boolean> {
  const template = getPaymentFailedEmailTemplate(adminName, firmName, billingUrl);
  return sendEmail({ to: email, ...template });
}

export async function sendStorageLimitWarningEmail(
  email: string,
  adminName: string,
  firmName: string,
  usedPercent: number,
  billingUrl: string
): Promise<boolean> {
  const template = getStorageLimitWarningEmailTemplate(adminName, firmName, usedPercent, billingUrl);
  return sendEmail({ to: email, ...template });
}

export async function sendSeatLimitReachedEmail(
  email: string,
  adminName: string,
  firmName: string,
  currentSeats: number,
  maxSeats: number,
  billingUrl: string
): Promise<boolean> {
  const template = getSeatLimitReachedEmailTemplate(adminName, firmName, currentSeats, maxSeats, billingUrl);
  return sendEmail({ to: email, ...template });
}

export async function sendEventAssignedEmail(
  email: string,
  name: string,
  title: string,
  startTime: string,
  firmName: string
): Promise<boolean> {
  const template = getEventAssignedEmailTemplate(name, title, startTime, firmName);
  return sendEmail({ to: email, ...template });
}

