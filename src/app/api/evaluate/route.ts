import { NextRequest, NextResponse } from 'next/server';
import { evaluateInterview } from '@/lib/gemini';
import { getInterview, updateInterview, createFeedbackReport, getUserByToken } from '@/lib/mock-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { interviewId, transcript, projectTitle, techStack, durationSeconds, userId: bodyUserId } = body;

    let targetTitle = projectTitle;
    let targetTech = techStack;
    let finalTranscript = transcript;

    let resumeSummary = '';

    let targetRole = 'sde';
    let allProjects: { title: string; techStack: string; description: string }[] = [];
    let resolvedUserId = bodyUserId;

    // Check session token cookie for user attribution
    const token = req.cookies.get('vantage_session')?.value;
    if (token && !resolvedUserId) {
      const user = await getUserByToken(token);
      if (user) resolvedUserId = user.id;
    }

    if (interviewId) {
      const interview = await getInterview(interviewId);
      if (interview) {
        if (!resolvedUserId && interview.user_id) {
          resolvedUserId = interview.user_id;
        }
        targetTitle = targetTitle || interview.project_title;
        targetTech = targetTech || interview.tech_stack;
        resumeSummary = interview.resume_summary || '';
        targetRole = interview.target_role || 'sde';
        if (interview.all_projects) {
          try {
            const parsed = JSON.parse(interview.all_projects);
            if (Array.isArray(parsed)) allProjects = parsed;
          } catch (_) {}
        }
        if (!finalTranscript || finalTranscript.length === 0) {
          finalTranscript = interview.transcript;
        }
      }
    }

    if (!finalTranscript || finalTranscript.length === 0) {
      return NextResponse.json(
        { error: 'No interview transcript provided to evaluate' },
        { status: 400 }
      );
    }

    const headerKey = req.headers.get('x-gemini-key');
    const apiKeyOverride = body.apiKeyOverride || (headerKey ? headerKey : undefined);

    // Call Evaluator AI with role & projects context
    const evaluation = await evaluateInterview(
      targetTitle || 'Full Stack Project',
      targetTech || 'React, Node.js, PostgreSQL',
      finalTranscript,
      resumeSummary,
      apiKeyOverride,
      targetRole,
      allProjects
    );

    // Save report to database
    const savedReport = await createFeedbackReport({
      interview_id: interviewId || crypto.randomUUID(),
      technical_score: evaluation.technical_score,
      communication_score: evaluation.communication_score,
      confidence_score: evaluation.confidence_score,
      overall_verdict: evaluation.overall_verdict,
      interview_skills_breakdown: evaluation.interview_skills_breakdown,
      interview_improvements: evaluation.interview_improvements,
      resume_score: evaluation.resume_score,
      resume_verdict: evaluation.resume_verdict,
      resume_rating_breakdown: evaluation.resume_rating_breakdown,
      resume_improvements: evaluation.resume_improvements,
      best_fit_roles: evaluation.best_fit_roles,
      suitable_job_links: evaluation.suitable_job_links,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      submitted_code: evaluation.submitted_code,
      improvements: evaluation.improvements,
      practice_plan: evaluation.practice_plan,
      topic_tags: evaluation.topic_tags,
    });

    // Update interview status to completed and record duration
    if (interviewId) {
      await updateInterview(interviewId, {
        status: 'completed',
        duration_seconds: durationSeconds || 600,
        transcript: finalTranscript,
        ...(resolvedUserId ? { user_id: resolvedUserId } : {}),
      });
    }

    return NextResponse.json({ report: savedReport });
  } catch (error) {
    console.error('Error in /api/evaluate:', error);
    return NextResponse.json(
      { error: 'Failed to generate evaluation report' },
      { status: 500 }
    );
  }
}
