import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSmtpTransport, getEmailFrom } from '@/lib/smtp';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Format the email content
    const emailContent = `
New Issue Report from HyperGamer

From: ${name} (${email})
Account: ${user.displayName} (${user.email})
Subject: ${subject}

Message:
${message}

---
Sent from HyperGamer by M. M. Rokku
Timestamp: ${new Date().toISOString()}
    `.trim();

    const reportRecipient = process.env.REPORT_EMAIL_TO?.trim();
    const subjectPrefix = process.env.REPORT_EMAIL_SUBJECT_PREFIX?.trim() || '[HyperGamer]';
    const mailSubject = `${subjectPrefix} ${subject}`;
    const transporter = createSmtpTransport();

    console.log('=== ISSUE REPORT ===');
    console.log('To:', reportRecipient || '(REPORT_EMAIL_TO not configured; logging only)');
    console.log('Subject:', mailSubject);
    console.log('Content:', emailContent);
    console.log('===================');

    if (reportRecipient && transporter) {
      await transporter.sendMail({
        from: getEmailFrom(),
        to: reportRecipient,
        subject: mailSubject,
        text: emailContent,
        replyTo: email,
      });
    }

    return NextResponse.json({
      success: true,
      message: reportRecipient && transporter
        ? 'Report submitted successfully.'
        : 'Report logged successfully. Configure SMTP + REPORT_EMAIL_TO to forward reports by email.',
    });
  } catch (error) {
    console.error('Error processing report:', error);
    return NextResponse.json(
      { error: 'Failed to process report' },
      { status: 500 }
    );
  }
}
