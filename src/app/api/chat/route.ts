import { NextResponse } from 'next/server';
import { generateInterviewerResponse, extractInterviewerTurn } from '@/lib/gemini';
import { getInterview, updateInterview } from '@/lib/mock-db';
import { ChatMessage } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      interviewId,
      studentMessage,
      studentAudioBase64,
      studentAudioMime,
      projectTitle,
      techStack,
      projectDescription,
      history = [],
      studentCode,
      codeLanguage,
      codeOutput,
    } = body;

    let targetTitle = projectTitle;
    let targetTech = techStack;
    let targetDesc = projectDescription;
    let resumeSummary = '';
    let interviewerPersona: 'alex' | 'sophia' = 'alex';
    let existingTranscript: ChatMessage[] = history;
    let allProjects: { title: string; techStack: string; description: string }[] = [];
    let targetRole = 'sde';

    if (interviewId) {
      const interview = await getInterview(interviewId);
      if (interview) {
        targetTitle = targetTitle || interview.project_title;
        targetTech = targetTech || interview.tech_stack;
        targetDesc = targetDesc || interview.project_description;
        resumeSummary = interview.resume_summary || '';
        interviewerPersona = interview.interviewer_persona || 'alex';
        targetRole = interview.target_role || 'sde';
        if (history.length === 0 && interview.transcript?.length > 0) {
          existingTranscript = interview.transcript;
        }
        // Parse all projects from resume
        if (interview.all_projects) {
          try {
            const parsed = JSON.parse(interview.all_projects);
            if (Array.isArray(parsed)) allProjects = parsed;
          } catch (_) {}
        }
      }
    }

    const headerKey = req.headers.get('x-gemini-key');
    const apiKeyOverride = body.apiKeyOverride || (headerKey ? headerKey : undefined);

    const result = await generateInterviewerResponse({
      projectTitle: targetTitle || 'Full Stack Application',
      techStack: targetTech || 'React, Node.js, PostgreSQL',
      projectDescription: targetDesc,
      resumeSummary,
      interviewerPersona,
      history: existingTranscript,
      studentMessage,
      studentAudioBase64,
      studentAudioMime,
      apiKeyOverride,
      allProjects,
      targetRole,
      studentCode,
      codeLanguage,
      codeOutput,
    });


    const extracted = extractInterviewerTurn(
      result.response,
      result.transcribedText || studentMessage
    );
    let aiResponse = extracted.response;
    let userUtterance = extracted.transcribedText || studentMessage;

    if (studentCode) {
      if (!userUtterance) {
        userUtterance = `[Submitted Code (${codeLanguage || 'code'})]:\n\`\`\`${codeLanguage || ''}\n${studentCode}\n\`\`\`${codeOutput ? `\n[Test Output]:\n${codeOutput}` : ''}`;
      } else if (!userUtterance.includes(studentCode)) {
        userUtterance = `${userUtterance}\n\n[Submitted Code (${codeLanguage || 'code'})]:\n\`\`\`${codeLanguage || ''}\n${studentCode}\n\`\`\``;
      }
    }

    // Absolute final guard: if the extracted text still looks like JSON, strip it safely
    if (aiResponse && (aiResponse.startsWith('{') || aiResponse.includes('"interviewerResponse"') || aiResponse.includes('"transcribedAnswer"'))) {
      const hardExtract = extractInterviewerTurn(aiResponse);
      aiResponse = hardExtract.response || aiResponse;
    }

    // Append to transcript if interviewId is present
    if (interviewId) {
      const updatedTranscript: ChatMessage[] = [...existingTranscript];
      if (userUtterance) {
        updatedTranscript.push({
          sender: 'user',
          text: userUtterance,
          timestamp: new Date().toISOString(),
        });
      }
      updatedTranscript.push({
        sender: 'ai',
        text: aiResponse,
        timestamp: new Date().toISOString(),
      });

      await updateInterview(interviewId, {
        transcript: updatedTranscript,
      });
    }

    return NextResponse.json({
      response: aiResponse,
      transcribedText: userUtterance,
    });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    return NextResponse.json(
      { error: 'Failed to generate interviewer response' },
      { status: 500 }
    );
  }
}
