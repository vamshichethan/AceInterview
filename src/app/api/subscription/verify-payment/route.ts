import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getUserByToken, getUserById, updateUser } from '@/lib/mock-db';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/subscription/verify-payment
 *
 * Verifies the Razorpay payment signature and activates subscription.
 * Called after successful payment in the Razorpay checkout modal.
 *
 * Body: {
 *   razorpay_order_id: string,
 *   razorpay_payment_id: string,
 *   razorpay_signature: string,
 *   userId: string,
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId: bodyUserId } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 });
    }

    // ── 1. Verify Razorpay Signature ──────────────────────────────────────────
    const keySecret = process.env.RAZORPAY_KEY_SECRET!;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('[Razorpay] Signature mismatch — possible fraud attempt');
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // ── 2. Identify User ─────────────────────────────────────────────────────
    const token = request.cookies.get('vantage_session')?.value;
    let userId = bodyUserId;

    if (!userId && token) {
      const tokenUser = await getUserByToken(token);
      if (tokenUser) userId = tokenUser.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Cannot identify user for subscription activation' }, { status: 401 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ── 3. Activate 30-Day Subscription ─────────────────────────────────────
    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    const updatedUser = await updateUser(userId, {
      subscription_status: 'active',
      subscription_expires_at: expiresAt,
    });

    // ── 4. Send Confirmation Email via Resend ────────────────────────────────
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'AceInterview.ai <noreply@aceinterview.ai>',
        to: [user.email],
        subject: '🎉 Your AceInterview.ai Pro subscription is now active!',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8" /></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a12; color: #e2e8f0; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(99, 102, 241, 0.3);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 32px; text-align: center;">
                <div style="font-size: 32px; margin-bottom: 8px;">🎯</div>
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">AceInterview.ai Pro</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 15px;">Your subscription is now active</p>
              </div>

              <!-- Body -->
              <div style="padding: 40px 32px;">
                <p style="font-size: 18px; color: #e2e8f0; margin: 0 0 24px;">Hey ${user.name} 👋</p>

                <p style="color: #94a3b8; line-height: 1.6; margin: 0 0 24px;">
                  Your payment of <strong style="color: #6366f1;">₹99</strong> was successful!
                  You now have <strong style="color: #e2e8f0;">unlimited AI mock interviews</strong> for the next 30 days.
                </p>

                <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <h3 style="color: #6366f1; margin: 0 0 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">What's Included</h3>
                  <ul style="color: #94a3b8; margin: 0; padding-left: 20px; line-height: 2;">
                    <li>✅ <strong style="color: #e2e8f0;">Unlimited</strong> AI mock interviews</li>
                    <li>✅ Real-time AI feedback on every answer</li>
                    <li>✅ Resume analysis & scoring</li>
                    <li>✅ Career role fit analysis</li>
                    <li>✅ Curated job application links</li>
                  </ul>
                </div>

                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 16px; margin: 24px 0;">
                  <p style="color: #10b981; margin: 0; font-size: 14px;">
                    📅 <strong>Active until:</strong> ${new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p style="color: #64748b; margin: 8px 0 0; font-size: 13px;">Payment ID: ${razorpay_payment_id}</p>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/student/setup"
                     style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
                    🚀 Start Your First Interview
                  </a>
                </div>
              </div>

              <!-- Footer -->
              <div style="border-top: 1px solid rgba(99, 102, 241, 0.2); padding: 24px 32px; text-align: center;">
                <p style="color: #475569; font-size: 13px; margin: 0;">
                  AceInterview.ai — Ace Every Interview<br/>
                  Questions? Reply to this email anytime.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      console.log('[Resend] Subscription confirmation email sent to', user.email);
    } catch (emailErr) {
      console.warn('[Resend] Failed to send confirmation email:', emailErr);
      // Don't fail the subscription activation just because email failed
    }

    return NextResponse.json({
      success: true,
      message: '🎉 Subscription activated! You now have unlimited interviews for 30 days.',
      paymentId: razorpay_payment_id,
      user: updatedUser,
      expiresAt,
    });
  } catch (err: any) {
    console.error('[Razorpay] Verify payment error:', err);
    return NextResponse.json(
      { error: err.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
