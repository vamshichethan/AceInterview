import { NextRequest, NextResponse } from 'next/server';
import {
  getUserByToken,
  getAllPayments,
  updatePaymentStatus,
} from '@/lib/mock-db';

export async function GET(request: NextRequest) {
  try {
    let token = request.cookies.get('vantage_session')?.value;
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const currentUser = await getUserByToken(token);
    const isSuperAdmin = Boolean(
      currentUser &&
        (currentUser.role === 'admin' ||
          currentUser.email?.toLowerCase().trim() === 'vamshicodes29@gmail.com')
    );

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only Super Admin (vamshicodes29@gmail.com) can view payments.' },
        { status: 403 }
      );
    }

    const payments = await getAllPayments();
    return NextResponse.json({ success: true, payments });
  } catch (err: any) {
    console.error('Error fetching payments:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let token = request.cookies.get('vantage_session')?.value;
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const currentUser = await getUserByToken(token);
    const isSuperAdmin = Boolean(
      currentUser &&
        (currentUser.role === 'admin' ||
          currentUser.email?.toLowerCase().trim() === 'vamshicodes29@gmail.com')
    );

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only Super Admin can modify payment status.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { paymentId, action } = body;

    if (!paymentId || !action) {
      return NextResponse.json({ error: 'paymentId and action are required' }, { status: 400 });
    }

    let status: 'verified' | 'rejected';
    if (action === 'verify') {
      status = 'verified';
    } else if (action === 'reject') {
      status = 'rejected';
    } else {
      return NextResponse.json({ error: 'Invalid action. Must be verify or reject' }, { status: 400 });
    }

    const updated = await updatePaymentStatus(paymentId, status);
    if (!updated) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, payment: updated });
  } catch (err: any) {
    console.error('Error updating payment:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
