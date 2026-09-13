import { NextResponse } from 'next/server';
import {
  verifyOtpCode,
  getUserByEmail,
  createUser,
  authenticateUser,
  isSuperAdminEmail,
} from '@/lib/mock-db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, name, password, role } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and 6-digit OTP code are required.' },
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

    // 1. Verify OTP
    const verification = await verifyOtpCode(normalizedEmail, otp, signatureToken);
    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.reason || 'Invalid or expired OTP.' },
        { status: 400 }
      );
    }

    // 2. Check if user already exists
    let user = await getUserByEmail(normalizedEmail);

    if (!user) {
      // New user signup
      const derivedName = name?.trim() || normalizedEmail.split('@')[0];
      const initialRole = isSuperAdminEmail(normalizedEmail) ? 'admin' : (role || 'user');
      user = await createUser(derivedName, normalizedEmail, password || 'default123', initialRole);
    }

    // 3. Authenticate and create session
    const authResult = await authenticateUser(normalizedEmail, password);
    if (!authResult) {
      return NextResponse.json(
        { error: 'Authentication failed after OTP verification.' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: authResult.user,
      token: authResult.token,
      message: 'Email verified successfully!',
    });

    // Set secure HTTP-only session cookie
    response.cookies.set('vantage_session', authResult.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 86400, // 30 days
    });
    response.cookies.delete('vantage_pending_otp');

    return response;
  } catch (err: any) {
    console.error('Verify OTP error:', err);
    return NextResponse.json(
      { error: err?.message || 'OTP verification failed.' },
      { status: 500 }
    );
  }
}
