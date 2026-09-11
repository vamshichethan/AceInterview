import { NextResponse } from 'next/server';
import { generateAndSaveOtp, getUserByEmail } from '@/lib/mock-db';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Configure Nodemailer for real-world SMTP (Gmail App Password, Brevo, SendGrid, Amazon SES, or custom SMTP)
function createEmailTransporter() {
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

  if (smtpUser && smtpPass) {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }

    const cleanUser = smtpUser.trim();
    const cleanPass = smtpPass.replace(/\s+/g, '');

    // Default to Gmail SMTP service
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
    });
  }

  return null;
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, purpose = 'login' } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await getUserByEmail(normalizedEmail);

    // Strict account existence validation
    if (purpose === 'signup') {
      if (existingUser) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in with your password.' },
          { status: 400 }
        );
      }
    } else if (purpose === 'reset_password' || purpose === 'forgot_password') {
      if (!existingUser) {
        return NextResponse.json(
          { error: 'No account found with this email address. Please sign up first.' },
          { status: 404 }
        );
      }
    } else if (purpose === 'login') {
      if (!existingUser) {
        return NextResponse.json(
          { error: 'No account found with this email. Please create an account first.' },
          { status: 404 }
        );
      }
    }

    const otp = await generateAndSaveOtp(normalizedEmail, purpose);

    let emailDelivered = false;
    let deliveryProvider = '';

    // Purpose-specific email copy
    let emailSubject = `🔐 Your AceInterview.ai Verification Code: ${otp}`;
    let emailHeader = 'AceInterview.ai Security Verification';
    let emailSubtitle = 'Use the 6-digit one-time passcode below to verify your account:';

    if (purpose === 'signup') {
      emailSubject = `🎉 Welcome to AceInterview.ai — Your Verification Code: ${otp}`;
      emailHeader = 'Confirm Your Email Address';
      emailSubtitle = 'Welcome to AceInterview.ai! Enter the 6-digit verification code below to activate your candidate profile:';
    } else if (purpose === 'reset_password' || purpose === 'forgot_password') {
      emailSubject = `🔑 Reset Your AceInterview.ai Password: ${otp}`;
      emailHeader = 'Password Reset Request';
      emailSubtitle = 'We received a request to reset your password. Use the 6-digit code below to set your new password:';
    }

    // 1. Try Nodemailer (Real SMTP: Gmail, Brevo, SendGrid, SES)
    const transporter = createEmailTransporter();
    if (transporter) {
      try {
        const sender = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'AceInterview.ai <auth@aceinterview.ai>';
        await transporter.sendMail({
          from: sender,
          to: normalizedEmail,
          subject: emailSubject,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f1f5f9; padding: 40px 24px; border-radius: 16px; max-width: 520px; margin: auto; border: 1px solid #1e293b;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #6366f1; font-size: 24px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.5px;">AceInterview<span style="color: #38bdf8;">.ai</span></h1>
                <p style="color: #94a3b8; font-size: 14px; margin: 0;">${emailHeader}</p>
              </div>

              <div style="background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
                <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 16px 0;">${emailSubtitle}</p>
                <div style="background: rgba(99, 102, 241, 0.12); border: 2px dashed #6366f1; padding: 18px 24px; text-align: center; border-radius: 12px; display: inline-block; margin: auto;">
                  <span style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #38bdf8; font-family: monospace;">${otp}</span>
                </div>
                <p style="color: #64748b; font-size: 12px; margin: 16px 0 0 0;">⏱️ This verification code expires in <strong>10 minutes</strong>.</p>
              </div>

              <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0; line-height: 1.5;">
                If you did not request this security code, please disregard this email. Your account remains completely secure.
              </p>
            </div>
          `,
        });
        emailDelivered = true;
        deliveryProvider = 'SMTP (Nodemailer)';
        console.log(`[Email] OTP email successfully sent via SMTP to ${normalizedEmail}`);
      } catch (smtpErr: any) {
        console.warn('[Email] SMTP delivery failed:', smtpErr?.message || smtpErr);
      }
    }

    // 2. Try Resend if SMTP is not configured or failed
    if (!emailDelivered && resend) {
      try {
        const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        const resendResult = await resend.emails.send({
          from: fromAddress,
          to: [normalizedEmail],
          subject: `🔐 Your AceInterview.ai Verification Code: ${otp}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f1f5f9; padding: 40px 24px; border-radius: 16px; max-width: 520px; margin: auto; border: 1px solid #1e293b;">
              <h2 style="color: #6366f1; margin-bottom: 8px;">AceInterview.ai Security Verification</h2>
              <p style="color: #94a3b8; font-size: 14px; margin-bottom: 24px;">Your 6-digit one-time passcode is below:</p>
              <div style="background: rgba(99, 102, 241, 0.12); border: 2px dashed #6366f1; padding: 18px 24px; text-align: center; border-radius: 12px;">
                <span style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #38bdf8; font-family: monospace;">${otp}</span>
              </div>
              <p style="color: #64748b; font-size: 12px; margin-top: 16px;">This code expires in 10 minutes.</p>
            </div>
          `,
        });

        if (resendResult.error) {
          throw new Error(resendResult.error.message || 'Resend API rejected delivery');
        }

        emailDelivered = true;
        deliveryProvider = 'Resend';
        console.log(`[Email] OTP email successfully sent via Resend to ${normalizedEmail}`);
      } catch (resendErr: any) {
        console.warn('[Email] Resend delivery failed:', resendErr?.message || resendErr);
      }
    }

    // Server-side audit log
    console.log(`=======================================================`);
    console.log(`🔑 [REAL-WORLD OTP DISPATCH]`);
    console.log(`   Recipient: ${normalizedEmail}`);
    console.log(`   Code:      ${otp}`);
    console.log(`   Purpose:   ${purpose}`);
    console.log(`   Delivered: ${emailDelivered ? `YES (${deliveryProvider})` : 'NO (Email credentials required)'}`);
    console.log(`=======================================================`);

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}. Please check your inbox or spam folder.`,
      emailDelivered,
    });
  } catch (err: any) {
    console.error('Send OTP error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to send OTP.' },
      { status: 500 }
    );
  }
}
