import { NextResponse } from 'next/server';
import { getFeedbackReport, getInterview, createFeedbackReport, updateInterview } from '@/lib/mock-db';
import { evaluateInterview } from '@/lib/gemini';

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const interviewId = params.id;

    // 1. Check if feedback report already exists
    let report = await getFeedbackReport(interviewId);
    if (report) {
      return NextResponse.json({ report });
    }

    // 2. If no report yet, check if interview exists
    const interview = await getInterview(interviewId);
    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // 3. If interview exists, synthesize evaluation dossier automatically
    let allProjects: { title: string; techStack: string; description: string }[] = [];
    if (interview.all_projects) {
      try {
        const parsed = JSON.parse(interview.all_projects);
        if (Array.isArray(parsed)) allProjects = parsed;
      } catch (_) {}
    }

    const evaluation = await evaluateInterview(
      interview.project_title || 'Engineering Assessment',
      interview.tech_stack || 'JavaScript, Python, React',
      interview.transcript || [],
      interview.resume_summary || '',
      undefined,
      interview.target_role || 'sde',
      allProjects
    );

    const savedReport = await createFeedbackReport({
      interview_id: interviewId,
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

    await updateInterview(interviewId, {
      status: 'completed',
      duration_seconds: interview.duration_seconds || 600,
      transcript: interview.transcript || [],
    });

    return NextResponse.json({ report: savedReport });
  } catch (error) {
    console.error('Error fetching/generating feedback report:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
