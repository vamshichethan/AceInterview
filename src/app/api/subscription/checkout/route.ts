import { NextRequest, NextResponse } from 'next/server';
import { getUserByToken, getUserById, processSubscriptionPayment } from '@/lib/mock-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { userId, paymentMethod } = body;

    // Check token if userId not provided in body
    if (!userId) {
      const token = request.cookies.get('vantage_session')?.value;
      if (token) {
        const user = await getUserByToken(token);
        if (user) userId = user.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'User must be authenticated to upgrade' }, { status: 401 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Process subscription payment for ₹99
    const method = paymentMethod || 'upi_autopay';
    const result = await processSubscriptionPayment(userId, 99, method);

    return NextResponse.json({
      success: true,
      message: '₹99 Subscription successfully activated for 30 days of unlimited interviews!',
      payment: result.payment,
      user: result.user,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Payment processing failed' }, { status: 500 });
  }
}
