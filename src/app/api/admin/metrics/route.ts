import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentMetrics, getUserByToken } from '@/lib/mock-db';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    let token = request.cookies.get('vantage_session')?.value;
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required to view placement analytics.' },
        { status: 401 }
      );
    }

    const user = await getUserByToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please sign in.' },
        { status: 401 }
      );
    }

    // Strict access control: Only Admin or users explicitly granted can_access_dashboard can view
    if (user.role !== 'admin' && !user.can_access_dashboard) {
      return NextResponse.json(
        {
          error: 'Restricted Access: You do not have Placement Officer privileges. Contact your administrator to request access.',
          user: { name: user.name, email: user.email, role: user.role },
        },
        { status: 403 }
      );
    }

    const metrics = await getDepartmentMetrics();
    return NextResponse.json({
      metrics,
      viewer: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        can_access_dashboard: user.can_access_dashboard,
      },
    });
  } catch (error) {
    console.error('Error fetching department metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch department metrics' },
      { status: 500 }
    );
  }
}

