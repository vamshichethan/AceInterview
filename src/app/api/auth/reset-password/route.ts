import { NextResponse } from 'next/server';
import { verifyOtpCode, updateUserPassword, authenticateUser } from '@/lib/mock-db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: 'Email, verification code (OTP), and new password are required.' },
        { status: 400 }
      );
    }

    if (String(newPassword).length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const cookieHeader = req.headers.get('cookie') || '';
    const pendingCookie = cookieHeader
      .split(';')
      .find((c) => c.trim().startsWith('vantage_pending_otp='))
      ?.split('=')[1]
      ?.trim();
    const signatureToken = body.signatureToken || pendingCookie;

    // 1. Verify the 6-digit OTP
    const isValid = await verifyOtpCode(normalizedEmail, String(otp).trim(), signatureToken);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired 6-digit verification code. Please request a new code.' },
        { status: 400 }
      );
    }

    // 2. Update password in the database
    const updatedUser = await updateUserPassword(normalizedEmail, String(newPassword));
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'No account found with this email address.' },
        { status: 404 }
      );
    }

    // 3. Authenticate and create a fresh session
    const authResult = await authenticateUser(normalizedEmail, String(newPassword));
    if (!authResult) {
      return NextResponse.json(
        { error: 'Password updated, but failed to initiate session. Please sign in.' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: '🎉 Password updated successfully! Signing you in...',
      user: authResult.user,
      token: authResult.token,
    });

    // Set secure HTTP-only session cookie
    response.cookies.set('vantage_session', authResult.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 86400, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error('Reset password error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to reset password.' },
      { status: 500 }
    );
  }
}
