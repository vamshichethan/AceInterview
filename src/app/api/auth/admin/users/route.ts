import { NextRequest, NextResponse } from 'next/server';
import {
  getAllUsers,
  getAllUsersForAdmin,
  updateUser,
  getUserById,
  getUserByToken,
  promoteUserRole,
} from '@/lib/mock-db';

export async function GET(request: NextRequest) {
  // Verify admin session if token provided
  let token = request.cookies.get('vantage_session')?.value;
  if (!token) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  let isSuperAdmin = false;
  if (token) {
    const currentUser = await getUserByToken(token);
    if (!currentUser || (!currentUser.can_access_dashboard && currentUser.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized access to user roster' }, { status: 403 });
    }
    isSuperAdmin = currentUser.role === 'admin';
  }

  // Super admin can see complete user records including stored passwords/credentials
  const all = isSuperAdmin ? await getAllUsersForAdmin() : await getAllUsers();
  return NextResponse.json({ users: all, isSuperAdmin });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, value, role } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action are required' }, { status: 400 });
    }

    const targetUser = await getUserById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let updated;
    if (action === 'toggle_dashboard') {
      const newAccess = value !== undefined ? Boolean(value) : !targetUser.can_access_dashboard;
      updated = await updateUser(userId, { can_access_dashboard: newAccess });
    } else if (action === 'promote_role') {
      const targetRole = role || (targetUser.role === 'college_admin' ? 'user' : 'college_admin');
      const dashboardPower = targetRole === 'college_admin' || targetRole === 'admin';
      updated = await promoteUserRole(userId, targetRole, dashboardPower);
    } else if (action === 'grant_pro') {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      updated = await updateUser(userId, {
        subscription_status: 'active',
        subscription_expires_at: expiresAt.toISOString(),
      });
    } else if (action === 'revoke_pro') {
      updated = await updateUser(userId, {
        subscription_status: 'expired',
      });
    } else if (action === 'reset_trial') {
      updated = await updateUser(userId, {
        interviews_conducted_count: 0,
        subscription_status: 'free_trial',
      });
    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
