import { NextRequest, NextResponse } from 'next/server';
import { createStudent, createInterview, getUserByToken, getUserById, checkUserInterviewAccess, incrementUserInterviewCount } from '@/lib/mock-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      branch,
      projectTitle,
      techStack,
      projectDescription,
      resumeSummary,
      resumeFileName,
      interviewerPersona,
      allProjects,
      targetRole,
      userId: bodyUserId,
    } = body;

    // 1. Check user authentication — SIGNUP IS STRICTLY REQUIRED
    let userId = bodyUserId;
    if (!userId) {
      const token = req.cookies.get('vantage_session')?.value;
      if (token) {
        const user = await getUserByToken(token);
        if (user) userId = user.id;
      }
    }

    // Reject unauthenticated requests: users must sign up to take an interview
    if (!userId) {
      return NextResponse.json(
        {
          error: 'AUTH_REQUIRED',
          message: 'Please sign up or sign in to start your technical mock interview. Every account receives 1 Free Technical Interview upon sign up.',
        },
        { status: 401 }
      );
    }

    // 2. Check paywall & free trial access limit
    const access = await checkUserInterviewAccess(userId);
    if (!access.allowed) {
      return NextResponse.json(
        {
          error: 'PAYWALL_REQUIRED',
          message: 'You have completed your 1 free interview trial! Please subscribe to AceInterview Pro (₹99/month) for unlimited technical evaluations, ATS resume scoring, and curated job matches.',
          reason: access.reason,
        },
        { status: 402 }
      );
    }

    if (!name || !branch || !projectTitle || !techStack) {
      return NextResponse.json(
        { error: 'Name, branch, project title, and tech stack are required.' },
        { status: 400 }
      );
    }

    const student = await createStudent(name, branch);

    const allProjectsStr = Array.isArray(allProjects) && allProjects.length > 0
      ? JSON.stringify(allProjects)
      : undefined;

    const interview = await createInterview(
      student.id,
      projectTitle,
      techStack,
      projectDescription || '',
      resumeSummary || '',
      resumeFileName || '',
      interviewerPersona || 'alex',
      allProjectsStr,
      targetRole || 'sde',
      userId
    );

    // If candidate has an account, increment their interview usage count
    if (userId) {
      await incrementUserInterviewCount(userId);
    }

    return NextResponse.json({
      success: true,
      studentId: student.id,
      interviewId: interview.id,
    });
  } catch (error) {
    console.error('Error in /api/student/setup:', error);
    return NextResponse.json(
      { error: 'Failed to initialize student interview session' },
      { status: 500 }
    );
  }
}

