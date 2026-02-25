import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? '';
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'noreply@ghostnet.io';
const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';

const shouldSendEmail =
  RESEND_API_KEY.length > 0 && !RESEND_API_KEY.startsWith('re_xxx');

const resend = shouldSendEmail ? new Resend(RESEND_API_KEY) : null;

async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  if (!resend) {
    console.log(`[Email] To: ${to} | Subject: ${subject}`);
    console.log(`[Email] Body: ${html}`);
    return;
  }

  await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  orgName: string,
): Promise<void> {
  await sendEmail(
    to,
    `Welcome to GHOSTNET — ${orgName}`,
    `<h1>Welcome, ${name}!</h1>
     <p>You've been added to <strong>${orgName}</strong> on GHOSTNET.</p>
     <p>Log in at <a href="${APP_URL}/login">${APP_URL}/login</a> to get started.</p>`,
  );
}

export async function sendInviteEmail(
  to: string,
  inviterName: string,
  orgName: string,
  role: string,
  inviteUrl: string,
): Promise<void> {
  await sendEmail(
    to,
    `You've been invited to ${orgName} on GHOSTNET`,
    `<h1>You're invited!</h1>
     <p><strong>${inviterName}</strong> invited you to join <strong>${orgName}</strong> as a <strong>${role}</strong>.</p>
     <p><a href="${inviteUrl}">Accept Invitation</a></p>
     <p>This link expires in 7 days.</p>`,
  );
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  await sendEmail(
    to,
    'GHOSTNET — Password Reset',
    `<h1>Password Reset</h1>
     <p>You requested a password reset. Click the link below to set a new password:</p>
     <p><a href="${resetUrl}">Reset Password</a></p>
     <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`,
  );
}

export async function sendAlertEmail(
  to: string,
  alertTitle: string,
  severity: string,
  sessionId: string,
  sessionUrl: string,
): Promise<void> {
  await sendEmail(
    to,
    `[${severity}] GHOSTNET Alert: ${alertTitle}`,
    `<h1>🚨 Alert: ${alertTitle}</h1>
     <p><strong>Severity:</strong> ${severity}</p>
     <p><strong>Session:</strong> ${sessionId}</p>
     <p><a href="${sessionUrl}">View Session Details</a></p>`,
  );
}
