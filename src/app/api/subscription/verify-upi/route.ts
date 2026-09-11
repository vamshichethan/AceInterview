import { NextRequest, NextResponse } from 'next/server';
import { getUserByToken, getUserById, recordUpiPayment } from '@/lib/mock-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { utr, upiId = '7975883646@ybl', amount = 99, userId: bodyUserId } = body;

    if (!utr || String(utr).trim().length < 6) {
      return NextResponse.json(
        { error: 'Please enter a valid 12-digit UPI Transaction / UTR reference number.' },
        { status: 400 }
      );
    }

    // Identify user from session or body
    let userId = bodyUserId;
    const token = request.cookies.get('vantage_session')?.value;
    if (!userId && token) {
      const sessionUser = await getUserByToken(token);
      if (sessionUser) userId = sessionUser.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to activate your subscription.' },
        { status: 401 }
      );
    }

    const cleanUtr = String(utr).trim();
    const cleanUpiId = String(upiId).trim();

    const result = await recordUpiPayment(userId, cleanUtr, amount, cleanUpiId);

    return NextResponse.json({
      success: true,
      message: '🎉 UPI Payment confirmed! Pro subscription is now active for 30 days.',
      payment: result.payment,
      user: result.user,
    });
  } catch (err: any) {
    console.error('Verify UPI error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to verify UPI transaction.' },
      { status: 500 }
    );
  }
}
