import { NextResponse } from 'next/server';
import { createUser, authenticateUser, verifyOtpCode } from '@/lib/mock-db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, otp } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Require OTP verification for registration
    if (!otp) {
      return NextResponse.json(
        { error: 'Email verification code (OTP) is required to register. Please enter the 6-digit code sent to your email.' },
        { status: 400 }
      );
    }

    const isOtpValid = await verifyOtpCode(email, String(otp).trim());
    if (!isOtpValid) {
      return NextResponse.json(
        { error: 'Invalid or expired 6-digit verification code. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Create user with 1 free interview trial
    await createUser(name, email, password, role || 'user');

    // Authenticate and issue session token
    const authResult = await authenticateUser(email, password);
    if (!authResult) {
      return NextResponse.json({ error: 'Failed to create session.' }, { status: 500 });
    }

    const response = NextResponse.json({
      success: true,
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
    console.error('Signup error:', err);
    return NextResponse.json(
      { error: err?.message || 'Error creating account.' },
      { status: 400 }
    );
  }
}
