import { createSmtpTransport, getEmailFrom, getReplyTo, isSmtpConfigured } from '@/lib/smtp';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeAppHref(url: string): string {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : '';
  } catch {
    return '';
  }
}

function buildWelcomeContent(displayName: string, appUrl: string) {
  const safeName = escapeHtml(displayName);
  const href = appUrl ? safeAppHref(appUrl) : '';
  const openLine = href
    ? `\nOpen HyperGamer: ${href}\n`
    : '\nSign in with the email and password you chose during setup.\n';

  const text = [
    `Hi ${displayName},`,
    '',
    'Welcome to HyperGamer — your companion for tracking workouts, progress, and healthy habits.',
    '',
    'You can log in anytime with this email address and the password you created.',
    openLine.trim(),
    '',
    'If you did not create this account, you can ignore this message.',
    '',
    '— M. M. ROKKU / HyperGamer',
  ].join('\n');

  const linkBlock = href
    ? `<p style="margin:24px 0;"><a href="${href.replace(/"/g, '&quot;')}" style="color:#2563eb;">Open HyperGamer</a></p>`
    : '<p style="margin:24px 0;">Sign in with the email and password you chose during setup.</p>';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#1f2937;max-width:560px;margin:0;padding:24px;">
  <p>Hi ${safeName},</p>
  <p>Welcome to <strong>HyperGamer</strong> — your companion for tracking workouts, progress, and healthy habits.</p>
  <p>You can log in anytime with this email address and the password you created.</p>
  ${linkBlock}
  <p style="font-size:14px;color:#6b7280;">If you did not create this account, you can ignore this message.</p>
  <p style="margin-top:32px;font-size:14px;color:#6b7280;">— M. M. ROKKU / HyperGamer</p>
</body>
</html>`;

  return { text, html };
}

/**
 * Sends a welcome email after a new profile is registered.
 * Requires SMTP_HOST and EMAIL_FROM. If not configured, logs the message (dev / staging).
 */
export async function sendWelcomeEmail(params: { to: string; displayName: string }): Promise<void> {
  const { to, displayName } = params;
  const appUrl = (process.env.APP_PUBLIC_URL || '').replace(/\/+$/, '');
  const subject = 'Welcome to HyperGamer';
  const { text, html } = buildWelcomeContent(displayName, appUrl);

  if (!isSmtpConfigured()) {
    console.log('=== WELCOME EMAIL (SMTP not configured; not sent) ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log(text);
    console.log('=====================================================');
    return;
  }

  const transporter = createSmtpTransport();
  if (!transporter) {
    return;
  }

  await transporter.sendMail({
    from: getEmailFrom(),
    to,
    subject,
    text,
    html,
    replyTo: getReplyTo(),
  });
}
