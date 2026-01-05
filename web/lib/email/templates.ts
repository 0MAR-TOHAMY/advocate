import { appName, appUrl } from "./config";

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

type Language = "ar" | "en";

// Logo URL
const LOGO_URL = "https://res.cloudinary.com/duummxhhc/image/upload/v1763578001/advocatebox_uhhfxw.png";

function getBaseStyles() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Montserrat', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #F9FBFF;
      direction: ltr;
    }
    
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #F9FBFF;
    }
    
    .email-container {
      background: white;
      overflow: hidden;
      box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.05);
    }
    
    .header {
      padding: 40px 30px;
      text-align: center;
    }
    
    .logo {
      max-width: 150px;
      height: auto;
      margin-bottom: 15px;
    }
    
    .header-subtitle {
      color: #6b7280;
      font-size: 14px;
      margin: 8px 0 0 0;
    }
    
    .content {
      padding: 40px 30px;
      background: white;
    }
    
    .greeting {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 20px;
    }
    
    .text {
      font-size: 15px;
      color: #4b5563;
      margin-bottom: 20px;
      line-height: 1.7;
    }
    
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: #3678FF;
      color: white !important;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 15px;
      transition: background 0.3s;
    }
    
    .button:hover {
      background: #2563EB;
    }
    
    .link-box {
      background: #F3F4F6;
      padding: 15px;
      margin: 20px 0;
      word-break: break-all;
    }
    
    .link-text {
      color: #3678FF;
      font-size: 13px;
      text-decoration: none;
    }
    
    .warning-box {
      background: #FEF3C7;
      padding: 20px;
      margin: 25px 0;
    }
    
    .warning-title {
      font-weight: 600;
      color: #92400E;
      margin-bottom: 10px;
      font-size: 15px;
      text-align: center;
    }
    
    .warning-list {
      margin: 10px 0;
      padding-left: 20px;
      color: #92400E;
    }
    
    .warning-list li {
      margin: 5px 0;
      font-size: 14px;
    }
    
    .success-box {
      background: #D1FAE5;
      padding: 20px;
      margin: 25px 0;
    }
    
    .success-title {
      font-weight: 600;
      color: #065F46;
      font-size: 16px;
      text-align: center;
    }
    
    .feature-box {
      background: #F9FBFF;
      padding: 18px;
      margin: 15px 0;
    }
    
    .feature-title {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
      font-size: 15px;
      text-align: center;
    }
    
    .feature-desc {
      color: #6b7280;
      font-size: 14px;
      margin: 0;
    }
    
    .note {
      font-size: 14px;
      color: #6b7280;
      margin: 20px 0;
      padding: 15px;
      background: #F9FAFB;
    }
    
    .note strong {
      color: #1f2937;
    }
    
    .footer {
      background: #F9FBFF;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #E5E7EB;
    }
    
    .footer-text {
      color: #6b7280;
      font-size: 13px;
      margin: 0;
    }
  `;
}

export function getVerificationEmailTemplate(
  name: string,
  verificationToken: string
): EmailTemplate {
  const verificationUrl = `${appUrl}/en/auth/verify-email?token=${verificationToken}`;

  return {
    subject: `${appName} - Email Verification`,
    html: `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getBaseStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <img src="${LOGO_URL}" alt="${appName}" class="logo">
              <h1 class="header-subtitle">Welcome to our platform</h1>
            </div>
            <div class="content">
              <h2 class="greeting">Hello ${name},</h2>
              <p class="text">Thank you for registering! Please verify your email address to activate your account.</p>
              <div class="button-container">
                <a href="${verificationUrl}" class="button">Verify Email</a>
              </div>
              <p class="text">Or copy and paste this link in your browser:</p>
              <div class="link-box">
                <a href="${verificationUrl}" class="link-text">${verificationUrl}</a>
              </div>
              <p class="note"><strong>Note:</strong> This link is valid for 24 hours and can only be used once.</p>
              <p class="text">If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p class="footer-text">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${name},

Thank you for registering! Please verify your email address to activate your account.

${verificationUrl}

Note: This link is valid for 24 hours and can only be used once.

If you didn't create an account, please ignore this email.

${appName}
    `,
  };
}

export function getPasswordResetEmailTemplate(
  name: string,
  resetToken: string
): EmailTemplate {
  const resetUrl = `${appUrl}/en/auth/reset-password?token=${resetToken}`;

  return {
    subject: `${appName} - Password Reset Request`,
    html: `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getBaseStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <img src="${LOGO_URL}" alt="${appName}" class="logo">
              <h1 class="header-subtitle">Password Reset</h1>
            </div>
            <div class="content">
              <h2 class="greeting">Hello ${name},</h2>
              <p class="text">We received a request to reset your password. Click the button below to create a new password:</p>
              <div class="button-container">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p class="text">Or copy and paste this link in your browser:</p>
              <div class="link-box">
                <a href="${resetUrl}" class="link-text">${resetUrl}</a>
              </div>
              <div class="warning-box">
                <div class="warning-title">Security Notice</div>
                <ul class="warning-list">
                  <li>This link is valid for 1 hour only</li>
                  <li>Can only be used once</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
              <p class="text">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
              <p class="footer-text">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${name},

We received a request to reset your password. Click the link below to create a new password:

${resetUrl}

Security Notice:
- This link is valid for 1 hour only
- Can only be used once
- Never share this link with anyone

If you didn't request a password reset, please ignore this email.

${appName}
    `,
  };
}

export function getPasswordChangedEmailTemplate(
  name: string
): EmailTemplate {
  const dateTime = new Date().toLocaleString("en-US", {
    timeZone: "Africa/Cairo",
    dateStyle: "full",
    timeStyle: "short"
  });

  return {
    subject: `${appName} - Password Changed Successfully`,
    html: `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getBaseStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <img src="${LOGO_URL}" alt="${appName}" class="logo">
              <h1 class="header-subtitle">Password Changed</h1>
            </div>
            <div class="content">
              <h2 class="greeting">Hello ${name},</h2>
              <div class="success-box">
                <div class="success-title">Your password has been changed successfully!</div>
              </div>
              <p class="text">This is a confirmation that your account password was recently changed.</p>
              <p class="text"><strong>Date & Time:</strong> ${dateTime}</p>
              <p class="text">If you didn't make this change, please contact our support team immediately to secure your account.</p>
            </div>
            <div class="footer">
              <p class="footer-text">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${name},

Your password has been changed successfully!

This is a confirmation that your account password was recently changed.

Date & Time: ${dateTime}

If you didn't make this change, please contact our support team immediately.

${appName}
    `,
  };
}

export function getWelcomeEmailTemplate(
  name: string
): EmailTemplate {
  return {
    subject: `${appName} - Welcome to Our Platform`,
    html: `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getBaseStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <img src="${LOGO_URL}" alt="${appName}" class="logo">
              <h1 class="header-subtitle">Welcome Aboard!</h1>
            </div>
            <div class="content">
              <h2 class="greeting">Hello ${name},</h2>
              <p class="text">Welcome to ${appName}! Your email has been verified and your account is now active. We're excited to have you on board!</p>
              
              <h3 class="greeting" style="font-size: 18px; margin-top: 30px;">What's Next?</h3>
              
              <div class="button-container">
                <a href="${appUrl}/en/dashboard" class="button">Go to Dashboard</a>
              </div>
              
              <p class="text">If you have any questions or need assistance, feel free to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p class="footer-text">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${name},

Welcome to ${appName}! Your email has been verified and your account is now active. We're excited to have you on board!

What's Next?

- Complete Your Profile: Add your professional information and customize your account settings.
- Explore Features: Discover all the powerful tools and features available to you.
- Manage Cases: Start organizing and tracking your legal cases efficiently.
- Get Support: Our support team is here to help you with any questions.

Go to Dashboard: ${appUrl}/en/dashboard

If you have any questions or need assistance, feel free to reach out to our support team.

${appName}
    `,
  };
}

export function getJoinRequestEmailTemplate(
  adminName: string,
  requesterName: string,
  firmName: string
): EmailTemplate {
  const dashboardUrl = `${appUrl}/en/dashboard/settings/team`;

  return {
    subject: `New Join Request - ${firmName}`,
    html: `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getBaseStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <img src="${LOGO_URL}" alt="${appName}" class="logo">
              <h1 class="header-subtitle">New Join Request</h1>
            </div>
            <div class="content">
              <h2 class="greeting">Hello ${adminName},</h2>
              <p class="text">${requesterName} has requested to join your firm <strong>${firmName}</strong>.</p>
              <div class="button-container">
                <a href="${dashboardUrl}" class="button">Review Request</a>
              </div>
              <p class="text">You can approve or reject this request from your team settings dashboard.</p>
            </div>
            <div class="footer">
              <p class="footer-text">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${adminName},

${requesterName} has requested to join your firm ${firmName}.

Review Request: ${dashboardUrl}

You can approve or reject this request from your team settings dashboard.

${appName}
    `,
  };
}

export function getJoinRequestStatusEmailTemplate(
  userName: string,
  firmName: string,
  status: "approved" | "rejected"
): EmailTemplate {
  const isApproved = status === "approved";
  const dashboardUrl = `${appUrl}/en/dashboard`;

  return {
    subject: `Join Request ${isApproved ? "Approved" : "Rejected"} - ${firmName}`,
    html: `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getBaseStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <img src="${LOGO_URL}" alt="${appName}" class="logo">
              <h1 class="header-subtitle">Join Request Status</h1>
            </div>
            <div class="content">
              <h2 class="greeting">Hello ${userName},</h2>
              <p class="text">Your request to join <strong>${firmName}</strong> has been <strong>${status}</strong>.</p>
              ${isApproved ? `
              <div class="button-container">
                <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
              </div>
              ` : `
              <p class="text">If you think this was a mistake, please contact the firm administrator.</p>
              `}
            </div>
            <div class="footer">
              <p class="footer-text">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${userName},

Your request to join ${firmName} has been ${status}.

${isApproved ? `Go to Dashboard: ${dashboardUrl}` : "If you think this was a mistake, please contact the firm administrator."}

${appName}
    `,
  };
}

export function getTrialEndingEmailTemplate(
  adminName: string,
  firmName: string,
  endDate: string,
  daysLeft: number
): EmailTemplate {
  const billingUrl = `${appUrl}/en/dashboard/subscription`;

  return {
    subject: `Your Free Trial Ends in ${daysLeft} Days - ${appName}`,
    html: `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getBaseStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <img src="${LOGO_URL}" alt="${appName}" class="logo">
              <h1 class="header-subtitle">Trial Ending Soon</h1>
            </div>
            <div class="content">
              <h2 class="greeting">Hello ${adminName},</h2>
              <p class="text">Your free trial for <strong>${firmName}</strong> will end on <strong>${endDate}</strong> (${daysLeft} days left).</p>
              <div class="warning-box">
                <div class="warning-title">Important Action Required</div>
                <p class="text" style="color: #92400E; font-size: 14px; text-align: center;">To avoid service interruption and keep your data active, please select a subscription plan before your trial ends.</p>
              </div>
              <div class="button-container">
                <a href="${billingUrl}" class="button">Choose a Plan</a>
              </div>
            </div>
            <div class="footer">
              <p class="footer-text">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${adminName},

Your free trial for ${firmName} will end on ${endDate} (${daysLeft} days left).

Important Action Required:
To avoid service interruption and keep your data active, please select a subscription plan before your trial ends.

Choose a Plan: ${billingUrl}

${appName}
    `,
  };
}
export function getInvitationEmailTemplate(
  firmName: string,
  inviteLink: string
): EmailTemplate {
  return {
    subject: `Invitation to join ${firmName} on ${appName}`,
    html: `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getBaseStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <img src="${LOGO_URL}" alt="${appName}" class="logo">
              <h1 class="header-subtitle">Team Invitation</h1>
            </div>
            <div class="content">
              <h2 class="greeting">Hello,</h2>
              <p class="text">You have been invited to join the firm <strong>${firmName}</strong> on ${appName}.</p>
              <div class="button-container">
                <a href="${inviteLink}" class="button">Join Team</a>
              </div>
              <p class="text">Or copy and paste this link in your browser:</p>
              <div class="link-box">
                <a href="${inviteLink}" class="link-text">${inviteLink}</a>
              </div>
              <p class="text">If you don't have an account, you will be asked to create one first.</p>
            </div>
            <div class="footer">
              <p class="footer-text">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello,

You have been invited to join the firm ${firmName} on ${appName}.

Join Team: ${inviteLink}

If you don't have an account, you will be asked to create one first.

${appName}
    `,
  };
}

export function getFirmDeletionOtpTemplate(
  adminName: string,
  firmName: string,
  otp: string
): EmailTemplate {
  return {
    subject: `Firm Deletion Verification Code - ${firmName}`,
    html: `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getBaseStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <img src="${LOGO_URL}" alt="${appName}" class="logo">
              <h1 class="header-subtitle">Firm Deletion Verification</h1>
            </div>
            <div class="content">
              <h2 class="greeting">Hello ${adminName},</h2>
              <p class="text">You have requested to delete the firm <strong>${firmName}</strong>. This action is irreversible.</p>
              <p class="text">Please use the following verification code to confirm this action:</p>
              
              <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 12px; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 5px; color: #1f2937; font-family: monospace;">${otp}</span>
              </div>

              <div class="warning-box">
                <div class="warning-title">Warning: Irreversible Action</div>
                <p class="text" style="color: #92400E; font-size: 14px; text-align: center;">By deleting this firm, all associated data, cases, and documents will be permanently removed (soft deleted) and all member access will be revoked immediately.</p>
              </div>

              <p class="note"><strong>Security Notice:</strong> This code will expire in 10 minutes. If you did not request this, please change your password immediately.</p>
            </div>
            <div class="footer">
              <p class="footer-text">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${adminName},

You have requested to delete the firm ${firmName}. This action is irreversible.

Verification Code: ${otp}

Warning: By deleting this firm, all associated data, cases, and documents will be permanently removed and all member access will be revoked immediately.

This code will expire in 10 minutes. If you did not request this, please change your password immediately.

${appName}
    `,
  };
}

export function getEventAssignedEmailTemplate(
  name: string,
  title: string,
  startTime: string,
  firmName: string
): EmailTemplate {
  const calendarUrl = `${appUrl}/en/dashboard/calendar`;

  return {
    subject: `New Event Assigned: ${title} - ${firmName}`,
    html: `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getBaseStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <img src="${LOGO_URL}" alt="${appName}" class="logo">
              <h1 class="header-subtitle">New Event Assigned</h1>
            </div>
            <div class="content">
              <h2 class="greeting">Hello ${name},</h2>
              <p class="text">You have been assigned to a new event in <strong>${firmName}</strong> calendar.</p>
              
              <div class="feature-box">
                <div class="feature-title text-brand-primary">Event: ${title}</div>
                <div class="feature-desc" style="text-align: center;">Time: ${startTime}</div>
              </div>

              <div class="button-container">
                <a href="${calendarUrl}" class="button">View Calendar</a>
              </div>
            </div>
            <div class="footer">
              <p class="footer-text">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${name},

You have been assigned to a new event in ${firmName} calendar.

Event: ${title}
Time: ${startTime}

View Calendar: ${calendarUrl}

${appName}
    `,
  };
}

export function getPaymentFailedEmailTemplate(
  adminName: string,
  firmName: string,
  billingUrl: string
): EmailTemplate {
  return {
    subject: `Payment Failed - Action Required for ${firmName}`,
    html: `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getBaseStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header" style="background: #FEE2E2;">
              <img src="${LOGO_URL}" alt="${appName}" class="logo">
              <h1 class="header-subtitle" style="color: #DC2626;">Payment Failed</h1>
            </div>
            <div class="content">
              <h2 class="greeting">Hello ${adminName},</h2>
              <p class="text">We were unable to process your payment for <strong>${firmName}</strong>.</p>
              <div class="warning-box" style="background: #FEE2E2;">
                <div class="warning-title" style="color: #DC2626;">Immediate Action Required</div>
                <p class="text" style="color: #DC2626; font-size: 14px; text-align: center;">Please update your payment method to avoid service interruption. Your account may be restricted if payment is not received within 7 days.</p>
              </div>
              <div class="button-container">
                <a href="${billingUrl}" class="button" style="background: #DC2626;">Update Payment Method</a>
              </div>
              <p class="text">If you believe this is an error, please contact our support team.</p>
            </div>
            <div class="footer">
              <p class="footer-text">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${adminName},

We were unable to process your payment for ${firmName}.

Immediate Action Required:
Please update your payment method to avoid service interruption. Your account may be restricted if payment is not received within 7 days.

Update Payment Method: ${billingUrl}

If you believe this is an error, please contact our support team.

${appName}
    `,
  };
}

export function getStorageLimitWarningEmailTemplate(
  adminName: string,
  firmName: string,
  usedPercent: number,
  billingUrl: string
): EmailTemplate {
  return {
    subject: `Storage ${usedPercent >= 100 ? "Limit Reached" : "Almost Full"} - ${firmName}`,
    html: `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getBaseStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header" style="background: #FEF3C7;">
              <img src="${LOGO_URL}" alt="${appName}" class="logo">
              <h1 class="header-subtitle" style="color: #D97706;">Storage ${usedPercent >= 100 ? "Limit Reached" : "Warning"}</h1>
            </div>
            <div class="content">
              <h2 class="greeting">Hello ${adminName},</h2>
              <p class="text">Your firm <strong>${firmName}</strong> has used <strong>${usedPercent}%</strong> of the allocated storage space.</p>
              <div class="warning-box">
                <div class="warning-title">${usedPercent >= 100 ? "Storage Full" : "Running Low on Space"}</div>
                <p class="text" style="color: #92400E; font-size: 14px; text-align: center;">${usedPercent >= 100 ? "You cannot upload new files until you free up space or upgrade your plan." : "Consider upgrading your storage to avoid interruptions."}</p>
              </div>
              <div class="button-container">
                <a href="${billingUrl}" class="button" style="background: #D97706;">Upgrade Storage</a>
              </div>
            </div>
            <div class="footer">
              <p class="footer-text">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${adminName},

Your firm ${firmName} has used ${usedPercent}% of the allocated storage space.

${usedPercent >= 100 ? "Storage Full: You cannot upload new files until you free up space or upgrade your plan." : "Running Low on Space: Consider upgrading your storage to avoid interruptions."}

Upgrade Storage: ${billingUrl}

${appName}
    `,
  };
}

export function getSeatLimitReachedEmailTemplate(
  adminName: string,
  firmName: string,
  currentSeats: number,
  maxSeats: number,
  billingUrl: string
): EmailTemplate {
  return {
    subject: `User Limit Reached - ${firmName}`,
    html: `
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${getBaseStyles()}</style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header" style="background: #EDE9FE;">
              <img src="${LOGO_URL}" alt="${appName}" class="logo">
              <h1 class="header-subtitle" style="color: #7C3AED;">User Limit Reached</h1>
            </div>
            <div class="content">
              <h2 class="greeting">Hello ${adminName},</h2>
              <p class="text">Your firm <strong>${firmName}</strong> has reached the maximum number of users (<strong>${currentSeats}/${maxSeats}</strong>).</p>
              <div class="warning-box" style="background: #EDE9FE;">
                <div class="warning-title" style="color: #7C3AED;">Cannot Add More Users</div>
                <p class="text" style="color: #7C3AED; font-size: 14px; text-align: center;">To invite more team members, please upgrade your plan or purchase additional seats.</p>
              </div>
              <div class="button-container">
                <a href="${billingUrl}" class="button" style="background: #7C3AED;">Add More Seats</a>
              </div>
            </div>
            <div class="footer">
              <p class="footer-text">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${adminName},

Your firm ${firmName} has reached the maximum number of users (${currentSeats}/${maxSeats}).

Cannot Add More Users: To invite more team members, please upgrade your plan or purchase additional seats.

Add More Seats: ${billingUrl}

${appName}
    `,
  };
}

