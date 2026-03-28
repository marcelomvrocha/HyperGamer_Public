import nodemailer from 'nodemailer';

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || '';
}

export function getReplyTo(): string | undefined {
  return process.env.EMAIL_REPLY_TO?.trim() || undefined;
}

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim() && getEmailFrom());
}

export function createSmtpTransport() {
  const host = process.env.SMTP_HOST?.trim();
  if (!host || !getEmailFrom()) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || '587');
  const secure =
    process.env.SMTP_SECURE === 'true' ||
    process.env.SMTP_SECURE === '1' ||
    port === 465;

  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });
}
