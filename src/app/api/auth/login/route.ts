import { NextResponse } from 'next/server';
import { authenticateUser, getUserByEmail } from '@/lib/mock-db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email. Please sign up first.' },
        { status: 404 }
      );
    }

    const authResult = await authenticateUser(normalizedEmail, password);
    if (!authResult) {
      return NextResponse.json(
        { error: 'Incorrect password. Click "Forgot password?" to reset it.' },
        { status: 401 }
      );
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
    console.error('Login error:', err);
    return NextResponse.json(
      { error: err?.message || 'Login failed.' },
      { status: 500 }
    );
  }
}
