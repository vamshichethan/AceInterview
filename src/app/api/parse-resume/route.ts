import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedResume } from '@/lib/types';
import { geminiKeyPool } from '@/lib/key-pool';

const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];

const RESUME_SYSTEM_PROMPT = `You are an expert technical interviewer and resume parser.
Extract key information from this student's resume for a technical project mock interview.

EXTRACTION RULES:
- candidateName: The student's full name (usually at the top of the resume)
- branch: Their engineering department
- projectTitle: The MAIN or most impressive project title from the resume
- techStack: ALL technologies, frameworks, databases, tools mentioned anywhere in the resume. Comma-separated.
- projectDescription: 2-3 sentences about the main project architecture and what it does
- resumeSummary: 2-3 sentences about the candidate's background and skills
- keyHighlights: 3-4 specific impressive technical claims or achievements from the resume
- drillDownTopics: 3-4 specific deep technical topics to probe in interview based on their stack
- allProjects: An array of ALL projects found in the resume (under headings like Projects, Academic Projects, Final Year Project, Work Experience etc). Each project must have title, techStack, and description.
- suggestedRole: The best fitting target role based on their skills and projects. Must be one of: "sde", "ai_ml", "frontend", "backend", "fullstack", "data_science", "devops", "mobile".

Return ONLY a valid JSON object, no markdown, no code fences. Schema:
{
  "candidateName": "string",
  "branch": "one of: Computer Science & Engineering, Information Technology, Data Science & AI, Electronics & Communication, Electrical Engineering",
  "projectTitle": "string - the main project name",
  "techStack": "string - comma separated technologies from the entire resume",
  "projectDescription": "string",
  "resumeSummary": "string",
  "suggestedRole": "one of: sde, ai_ml, frontend, backend, fullstack, data_science, devops, mobile",
  "keyHighlights": ["string", "string", "string"],
  "drillDownTopics": ["string", "string", "string"],
  "allProjects": [
    { "title": "Project Name", "techStack": "tech1, tech2", "description": "What this project does in 1-2 sentences" }
  ]
}

If you truly cannot find a field, use empty string or empty array. Never skip a field key.`;


async function callGeminiWithPDF(base64Pdf: string, resumeText: string): Promise<ParsedResume | null> {
  if (!geminiKeyPool.available) return null;

  try {
    const result = await geminiKeyPool.call(async (genAI) => {
      for (const modelName of GEMINI_MODELS) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: RESUME_SYSTEM_PROMPT,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.05,
            },
          });

          const promptParts: any[] = [];
          if (base64Pdf) {
            promptParts.push({ inlineData: { data: base64Pdf, mimeType: 'application/pdf' } });
            promptParts.push({ text: 'Parse this resume PDF and return the JSON object.' });
          } else if (resumeText) {
            promptParts.push({ text: `Parse this resume text:\n\n${resumeText.slice(0, 20000)}\n\nReturn JSON only.` });
          } else {
            continue;
          }

          const result = await model.generateContent(promptParts);
          const rawText = result.response.text().trim()
            .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

          const parsed = JSON.parse(rawText);
          if (parsed && typeof parsed === 'object') return parsed;
        } catch (err: any) {
          const msg = String(err?.message || '').toLowerCase();
          if (msg.includes('quota') || msg.includes('429') || msg.includes('rate') || msg.includes('resource_exhausted')) {
            throw err; // key pool rotates
          }
          console.warn(`[parse-resume] Model ${modelName} failed:`, msg.slice(0, 80));
        }
      }
      throw new Error('All models exhausted on this key');
    });

    if (result && typeof result === 'object') {
      const allProjects = Array.isArray(result.allProjects)
        ? result.allProjects.map((p: any) => ({
            title: String(p.title || '').trim(),
            techStack: String(p.techStack || '').trim(),
            description: String(p.description || '').trim(),
          })).filter((p: any) => p.title)
        : [];

      const validRoles = ['sde', 'ai_ml', 'frontend', 'backend', 'fullstack', 'data_science', 'devops', 'mobile'];
      const rawRole = String(result.suggestedRole || '').toLowerCase().trim();
      const suggestedRole = validRoles.includes(rawRole) ? (rawRole as any) : undefined;

      return {
        candidateName: String(result.candidateName || '').trim(),
        branch: String(result.branch || 'Computer Science & Engineering').trim(),
        projectTitle: String(result.projectTitle || (allProjects[0]?.title) || '').trim(),
        techStack: String(result.techStack || '').trim(),
        projectDescription: String(result.projectDescription || '').trim(),
        resumeSummary: String(result.resumeSummary || '').trim(),
        suggestedRole,
        keyHighlights: Array.isArray(result.keyHighlights) ? result.keyHighlights.filter(Boolean) : [],
        drillDownTopics: Array.isArray(result.drillDownTopics) ? result.drillDownTopics.filter(Boolean) : [],
        allProjects,
      };
    }
  } catch (err) {
    console.error('[parse-resume] All keys exhausted:', err);
  }

  // If PDF inline failed, retry with extracted text
  if (resumeText && base64Pdf) {
    return callGeminiWithPDF('', resumeText);
  }

  return null;
}


/**
 * Simple text extraction from PDF bytes without dependencies.
 * Looks for readable ASCII sequences — works for most text-based PDFs.
 */
function extractTextFromPdfBuffer(buffer: Buffer): string {
  try {
    const raw = buffer.toString('latin1');
    // Extract text between BT (begin text) and ET (end text) operators
    const chunks: string[] = [];

    // Method 1: BT...ET blocks
    const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g;
    let match;
    while ((match = btEtRegex.exec(raw)) !== null) {
      const block = match[1];
      // Tj and TJ operators contain text
      const tjRegex = /\((.*?)\)\s*T[jJ]/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(block)) !== null) {
        const text = tjMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\');
        chunks.push(text);
      }

      // Array TJ
      const arrayTjRegex = /\[(.*?)\]\s*TJ/g;
      let arrayMatch;
      while ((arrayMatch = arrayTjRegex.exec(block)) !== null) {
        const arrayContent = arrayMatch[1];
        const innerRegex = /\((.*?)\)/g;
        let innerMatch;
        while ((innerMatch = innerRegex.exec(arrayContent)) !== null) {
          chunks.push(innerMatch[1]);
        }
      }
    }

    // Method 2: Simple readable ASCII fallback
    if (chunks.length < 20) {
      const asciiRegex = /[\x20-\x7E]{4,}/g;
      const asciiMatches = raw.match(asciiRegex) || [];
      // Filter to likely human-readable content
      const readable = asciiMatches
        .filter(s => s.length > 6 && /[a-zA-Z]/.test(s) && !/^[^\w\s]+$/.test(s))
        .slice(0, 500);
      return readable.join(' ');
    }

    return chunks.join(' ').replace(/\s+/g, ' ').trim();
  } catch (_) {
    return '';
  }
}

/**
 * Heuristic parser for when Gemini is unavailable
 */
function parseResumeHeuristically(text: string, fileName: string): ParsedResume {
  const lines = text.split(/\n|\r/).map(l => l.trim()).filter(Boolean);

  // Name: first short line without numbers
  let candidateName = '';
  for (const line of lines.slice(0, 5)) {
    if (line.length > 2 && line.length < 45 && /^[A-Za-z\s.]+$/.test(line) && !/(resume|cv|curriculum)/i.test(line)) {
      candidateName = line;
      break;
    }
  }

  // Branch detection
  let branch = 'Computer Science & Engineering';
  const lowerText = text.toLowerCase();
  if (/information technology|\bit\b/.test(lowerText)) branch = 'Information Technology';
  else if (/data science|artificial intelligence|ai &? ml|machine learning/.test(lowerText)) branch = 'Data Science & AI';
  else if (/electronics|communication|\bece\b/.test(lowerText)) branch = 'Electronics & Communication';
  else if (/electrical engineering|\bee\b/.test(lowerText)) branch = 'Electrical Engineering';

  // Project title
  let projectTitle = '';
  const projectIdx = lines.findIndex(l => /^projects?$|^technical projects?$|^academic projects?$/i.test(l));
  if (projectIdx >= 0) {
    for (let i = projectIdx + 1; i < Math.min(projectIdx + 5, lines.length); i++) {
      const candidate = lines[i].replace(/[-|:•*▪→]/g, '').trim();
      if (candidate.length > 5 && candidate.length < 80 && /[a-z]/i.test(candidate)) {
        projectTitle = candidate;
        break;
      }
    }
  }

  // Tech stack
  const techKeywords = [
    'React', 'Next.js', 'Vue', 'Angular', 'Svelte',
    'Node.js', 'Express', 'Python', 'FastAPI', 'Django', 'Flask',
    'PostgreSQL', 'MongoDB', 'MySQL', 'SQLite', 'Redis', 'Elasticsearch',
    'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
    'WebSockets', 'GraphQL', 'REST', 'gRPC',
    'TypeScript', 'JavaScript', 'Go', 'Rust', 'Java', 'Spring Boot',
    'Kafka', 'RabbitMQ', 'MQTT', 'InfluxDB', 'Flutter', 'Tailwind',
  ];
  const detected = techKeywords.filter(k => new RegExp(`\\b${k.replace('.', '\\.')}\\b`, 'i').test(text));
  const techStack = detected.join(', ');

  return {
    candidateName,
    branch,
    projectTitle,
    techStack,
    projectDescription: projectTitle
      ? `Engineering project "${projectTitle}" utilizing ${detected.slice(0, 3).join(', ') || 'modern technologies'}.`
      : '',
    resumeSummary: candidateName
      ? `${candidateName} - ${branch} student${techStack ? ` with experience in ${detected.slice(0, 3).join(', ')}` : ''}.`
      : '',
    keyHighlights: detected.length > 0
      ? [`Experience with ${detected.slice(0, 3).join(', ')}`, `${branch} background`]
      : [],
    drillDownTopics: [
      'System Architecture & Design Decisions',
      'Database Schema & Query Optimization',
      'API Security & Authentication',
      'Concurrency & Error Handling',
    ],
    allProjects: projectTitle ? [{ title: projectTitle, techStack, description: '' }] : [],
  };
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let resumeText = '';
    let fileName = '';
    let base64Pdf = '';

    if (contentType.includes('application/json')) {
      const json = await req.json();
      resumeText = json.text || '';
      base64Pdf = json.base64Pdf || '';
      fileName = json.fileName || 'pasted_resume.txt';
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const rawText = formData.get('text') as string | null;

      if (file) {
        fileName = file.name;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          base64Pdf = buffer.toString('base64');
          resumeText = extractTextFromPdfBuffer(buffer);
          console.log(`[parse-resume] PDF: base64=${base64Pdf.length} chars, extracted text=${resumeText.length} chars`);
        } else {
          resumeText = buffer.toString('utf-8');
        }
      } else if (rawText) {
        resumeText = rawText;
        fileName = 'pasted_resume.txt';
      }
    } else {
      // Fallback: try text directly
      resumeText = await req.text();
      fileName = 'uploaded_resume.txt';
    }

    if (!resumeText.trim() && !base64Pdf) {
      return NextResponse.json(
        { error: 'Could not read the uploaded file. Please try a PDF or TXT file.' },
        { status: 400 }
      );
    }

    // Try Gemini using the 3-key pool (auto-rotates on rate limits)
    if (geminiKeyPool.available) {
      const parsed = await callGeminiWithPDF(base64Pdf, resumeText);
      if (parsed) {
        const filledFields = [parsed.candidateName, parsed.projectTitle, parsed.techStack].filter(Boolean).length;
        console.log(`[parse-resume] Gemini extracted ${filledFields}/3 critical fields`);
        return NextResponse.json({ success: true, fileName, parsed, filledFields });
      }
    }

    // Heuristic fallback
    console.warn('[parse-resume] Gemini unavailable, using heuristic parser');
    const heuristic = parseResumeHeuristically(resumeText || '', fileName);
    return NextResponse.json({ success: true, fileName, parsed: heuristic, filledFields: 0 });

  } catch (error: any) {
    console.error('[parse-resume] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse resume. Please try again or fill fields manually.' },
      { status: 500 }
    );
  }
}
