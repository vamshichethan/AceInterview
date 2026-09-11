import { NextRequest, NextResponse } from 'next/server';
import { getUserByToken, checkUserInterviewAccess } from '@/lib/mock-db';

export async function GET(request: NextRequest) {
  // Check cookie first
  let token = request.cookies.get('vantage_session')?.value;

  // Fallback to Authorization header
  if (!token) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const user = await getUserByToken(token);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const accessCheck = await checkUserInterviewAccess(user.id);

  return NextResponse.json({
    user,
    interviewAccess: accessCheck,
  });
}

