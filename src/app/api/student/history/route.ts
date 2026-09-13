import { NextRequest, NextResponse } from 'next/server';
import { getUserByToken, getUserInterviewHistory } from '@/lib/mock-db';

export async function GET(request: NextRequest) {
  try {
    let token = request.cookies.get('vantage_session')?.value;
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    let currentUser = null;
    if (token) {
      currentUser = await getUserByToken(token);
    }

    // Support query params if user session is loaded
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId') || currentUser?.id;
    const queryEmail = searchParams.get('email') || currentUser?.email;
    const queryName = searchParams.get('name') || currentUser?.name;

    const history = await getUserInterviewHistory(queryUserId, queryEmail, queryName);

    // Calculate aggregated growth metrics
    const totalInterviews = history.length;
    let avgTechScore = 0;
    let avgCommScore = 0;
    let avgOverallScore = 0;
    let bestScore = 0;

    if (totalInterviews > 0) {
      const sumTech = history.reduce((acc, curr) => acc + (curr.technicalScore || 0), 0);
      const sumComm = history.reduce((acc, curr) => acc + (curr.communicationScore || 0), 0);
      const sumOverall = history.reduce((acc, curr) => acc + (curr.overallScore || 0), 0);

      avgTechScore = Math.round((sumTech / totalInterviews) * 10) / 10;
      avgCommScore = Math.round((sumComm / totalInterviews) * 10) / 10;
      avgOverallScore = Math.round((sumOverall / totalInterviews) * 10) / 10;
      bestScore = Math.max(...history.map((h) => h.overallScore || 0));
    }

    // Chronological progression for recharts growth timeline
    const growthTrend = history
      .slice()
      .reverse()
      .map((item, idx) => ({
        session: `Attempt #${idx + 1}`,
        overall: item.overallScore,
        tech: item.technicalScore,
        comm: item.communicationScore,
        date: item.createdAt ? item.createdAt.slice(0, 10) : '',
        role: item.targetRole.toUpperCase(),
      }));

    return NextResponse.json({
      success: true,
      history,
      stats: {
        totalInterviews,
        avgTechScore,
        avgCommScore,
        avgOverallScore,
        bestScore,
        growthTrend,
      },
    });
  } catch (error: any) {
    console.error('[API Student History Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch interview history' },
      { status: 500 }
    );
  }
}
