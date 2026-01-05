import nodemailer from "nodemailer";

export const emailConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
};

export const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@legalcase.com";
export const appName = process.env.APP_NAME || "Legal Case Manager";
export const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

let transporter: nodemailer.Transporter | null = null;

export function getEmailTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport(emailConfig);
  }
  return transporter;
}

export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const transporter = getEmailTransporter();
    await transporter.verify();
    console.log("✅ Email server connection verified");
    return true;
  } catch (error) {
    console.error("❌ Email server connection failed:", error);
    return false;
  }
}
