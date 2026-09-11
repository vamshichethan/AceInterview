import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getUserByToken, getUserById, updateUser } from '@/lib/mock-db';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * POST /api/subscription/create-order
 *
 * Creates a Razorpay order for ₹99/month subscription.
 * The client uses the returned order_id to open Razorpay checkout modal.
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const token = request.cookies.get('vantage_session')?.value;
    let userId: string | undefined;

    if (token) {
      const user = await getUserByToken(token);
      if (user) userId = user.id;
    }

    const body = await request.json().catch(() => ({}));
    if (!userId && body.userId) userId = body.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create Razorpay order — ₹99 = 9900 paise
    const order = await razorpay.orders.create({
      amount: 9900, // amount in paise (₹99)
      currency: 'INR',
      receipt: `ace_${userId.slice(0, 8)}_${Date.now()}`,
      notes: {
        userId,
        userEmail: user.email,
        userName: user.name,
        product: 'AceInterview.ai Pro — 1 Month Unlimited Interviews',
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (err: any) {
    console.error('[Razorpay] Create order error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
