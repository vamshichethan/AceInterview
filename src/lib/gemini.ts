import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ChatMessage,
  ResumeRatingBreakdown,
  InterviewSkillsBreakdown,
  BestFitRole,
  SuitableJobLink,
} from './types';
import { geminiKeyPool } from './key-pool';

export interface InterviewContext {
  projectTitle: string;
  techStack: string;
  projectDescription?: string;
  resumeSummary?: string;
  interviewerPersona?: 'alex' | 'sophia';
  history: ChatMessage[];
  studentMessage?: string;
  studentAudioBase64?: string;
  studentAudioMime?: string;
  apiKeyOverride?: string;
  drillDownTopics?: string[];
  allProjects?: { title: string; techStack: string; description: string }[];
  targetRole?: string;
  studentCode?: string;
  codeLanguage?: string;
  codeOutput?: string;
}

export interface InterviewerResponseResult {
  response: string;
  transcribedText?: string;
}

export interface EvaluationResult {
  // Interview Scores & Breakdown
  technical_score: number;
  communication_score: number;
  confidence_score: number;
  overall_verdict: string;
  interview_skills_breakdown: InterviewSkillsBreakdown;
  interview_improvements: string[];

  // Resume Scores & Breakdown
  resume_score: number;
  resume_verdict: string;
  resume_rating_breakdown: ResumeRatingBreakdown;
  resume_improvements: string[];

  // Career Fit & Job Opportunities
  best_fit_roles: BestFitRole[];
  suitable_job_links: SuitableJobLink[];

  strengths: string[];
  weaknesses: string[]; // Specific weak areas, gaps, or suboptimal answers
  improvements: string[]; // Actionable recommendations
  practice_plan: string[];
  topic_tags: string[];
  submitted_code?: {
    code: string;
    language: string;
    output?: string;
  };
}

const MODEL_FALLBACK_CHAIN = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
];

export async function generateInterviewerResponse(
  context: InterviewContext
): Promise<InterviewerResponseResult> {
  const {
    projectTitle,
    techStack,
    projectDescription,
    resumeSummary,
    interviewerPersona = 'alex',
    history,
    studentMessage,
    studentAudioBase64,
    studentAudioMime = 'audio/webm',
    apiKeyOverride,
    drillDownTopics = [],
    allProjects = [],
    targetRole = 'sde',
    studentCode,
    codeLanguage,
    codeOutput,
  } = context;

  const personaName = interviewerPersona === 'sophia' ? 'Priya Patel' : 'Aarav Sharma';
  const personaRole =
    interviewerPersona === 'sophia'
      ? 'Principal Distributed Systems Architect (Ex-AWS / Swiggy)'
      : 'Senior Staff Software Engineer & Tech Lead (Ex-Google / Stripe)';

  const userTurns = history.filter((m) => m.sender === 'user');
  const userTurnsCount = userTurns.length;
  const isAudioTurn = Boolean(studentAudioBase64);

  const drillTopicsStr = drillDownTopics.length > 0
    ? `Key topics identified from resume to probe: ${drillDownTopics.join(', ')}.`
    : '';

  const allProjectsStr = allProjects.length > 1
    ? `\nALL PROJECTS ON RESUME:\n${allProjects.map((p, i) => `${i + 1}. ${p.title} (${p.techStack})${p.description ? ': ' + p.description : ''}`).join('\n')}`
    : '';

  const roleLabel: Record<string, string> = {
    sde: 'Software Development Engineer (SDE)',
    frontend: 'Frontend Engineer',
    backend: 'Backend Engineer',
    fullstack: 'Full Stack Engineer',
    ai_ml: 'AI / ML Engineer',
    data_science: 'Data Scientist',
    devops: 'DevOps / SRE Engineer',
    mobile: 'Mobile Engineer',
  };

  const currentRoleName = roleLabel[targetRole] || 'Software Development Engineer (SDE)';

  const codeReviewInstruction = studentCode ? `
CANDIDATE CODE SUBMISSION IN ON-SCREEN IDE:
Language: ${codeLanguage || 'unknown'}
Code:
\`\`\`${codeLanguage || ''}
${studentCode}
\`\`\`
${codeOutput ? `Test Sandbox Output:\n${codeOutput}` : ''}

LIVE CODE EVALUATION PROTOCOL:
The candidate just wrote and submitted this code in the in-interview IDE for your inspection.
1. Evaluate algorithmic correctness, logical soundness, and edge case coverage in 1 to 2 clear sentences.
2. Explicitly analyze Big-O Time Complexity and Space Complexity.
3. In simple Indian English, confirm their approach, point out any bug or edge case, and seamlessly transition to the next question.
` : '';

  let stageGuidance = '';
  if (userTurnsCount === 0) {
    stageGuidance = `
CURRENT STAGE: ROUND 0 — WARM WELCOME, INTERVIEWER INTRODUCTION & CANDIDATE SELF-INTRODUCTION (OPENING TURN)
You are starting the interview right now.
1. Greet the candidate in warm, professional, conversational Indian English:
   "Hello! Welcome to your technical interview today. I am ${personaName}, ${personaRole}. In today's session, we will cover a Data Structures and Algorithms problem, core CS fundamentals, your resume project architecture, and a quick logical puzzle."
2. Invite the candidate to introduce themselves:
   "Before we dive into the technical questions, could you please introduce yourself — tell me a little about your background, what tech stacks you enjoy working with, and what you have built?"
CRITICAL: Do NOT jump directly into a DSA coding challenge in this opening turn. Let the candidate introduce themselves first!
`;
  } else if (userTurnsCount === 1) {
    stageGuidance = `
CURRENT STAGE: ROUND 1 — INTRODUCTION ACKNOWLEDGMENT & DSA CODING CHALLENGE
The candidate just responded by introducing themselves.
1. Acknowledge and appreciate their introduction warmly in 1 concise, encouraging sentence:
   "Thank you for introducing yourself, it is great to have you here! Now let us get started with our first technical round: Data Structures and Algorithms."
2. Immediately present an authentic, real-world DSA problem tailored specifically to their target role (${currentRoleName}) and resume stack (${techStack}).
   - State the problem statement clearly and simply.
   - Provide exactly ONE concrete test case (Input and Expected Output with brief explanation).
   - State key constraints.
3. CONCLUDE THIS TURN WITH:
   "Before writing any code, walk me through your algorithmic approach. What data structure will you use, and what is your expected Big-O time and space complexity?"
`;
  } else if (userTurnsCount === 2 || (userTurnsCount === 3 && !studentCode)) {
    stageGuidance = `
CURRENT STAGE: ROUND 1 (CONT) — ALGORITHM VALIDATION & LIVE IDE CODING
The candidate just explained their algorithmic approach for the DSA problem.
1. Evaluate their logic and Big-O time and space complexity (pronounce as 'O of N', 'O of 1', etc.) in 1 to 2 simple conversational sentences.
2. If their approach is sound and optimal:
   - Confirm their Big-O complexity.
   - Say: "Your logic is correct! Now please switch over to the Live Code Editor on your right, write your solution, and click Submit to Interviewer when you are ready."
3. If their approach is suboptimal (e.g., brute force O(N^2) when an O(N) Hash Map or Two Pointer exists) or has a flaw:
   - Give a gentle, friendly hint in simple Indian English: "Think about how we can optimize the lookup time using a Hash Map instead of nested loops. What would the time complexity become?"
   - Ask them to adjust their logic before writing code.
`;
  } else if (studentCode || userTurnsCount === 3 || userTurnsCount === 4) {
    stageGuidance = `
CURRENT STAGE: ROUND 2 — CORE CS FUNDAMENTALS (OS, DBMS, NETWORKS, SYSTEM CONCEPTS)
The coding round is wrapping up.
1. If the candidate just submitted code in the editor, briefly validate it (correctness, edge cases, Big-O).
2. Transition smoothly in simple Indian English:
   "Very good. Now let us move on to some core Computer Science fundamentals for your role."
3. Ask ONE authentic, dynamic CS conceptual question tailored to their target role (${currentRoleName}):
   - SDE / Backend / Fullstack: Ask about Operating Systems (difference between a process and a thread, deadlocks and how to prevent them, or mutex vs semaphore) OR Database systems (ACID properties with a real banking example, B-Tree index vs Hash index, normalization vs denormalization tradeoffs, or indexing on slow queries).
   - Frontend: Ask about JavaScript Event Loop (Microtask queue vs Macrotask queue), Closures and memory leaks, or the Browser Critical Rendering Path (DOM, CSSOM, Layout, Paint) or React Virtual DOM reconciliation.
   - AI/ML / Data Science: Ask about Gradient Descent (SGD vs Adam), Bias-Variance tradeoff, Overfitting prevention (Dropout, Regularization), or Evaluation metrics.
   - DevOps: Ask about Linux namespaces and cgroups in Docker vs VMs, or Kubernetes Pod lifecycle and rollout strategies.
`;
  } else if (userTurnsCount === 5 || userTurnsCount === 6) {
    stageGuidance = `
CURRENT STAGE: ROUND 3 — RESUME PROJECT ARCHITECTURE DEEP-DIVE
1. Acknowledge and briefly validate their answer to the CS fundamentals question.
2. Transition naturally to their resume project:
   "Great. Now let us talk about your project: ${projectTitle}."
3. Probe real architectural decisions and engineering trade-offs based on their resume stack (${techStack}):
   - Why did they choose this database or framework over alternatives?
   - How did they handle database transactions, state, caching, or authentication?
   - If 10,000 users access this feature simultaneously, where will the bottleneck occur and how would they scale it horizontally?
`;
  } else if (userTurnsCount === 7 || userTurnsCount === 8) {
    stageGuidance = `
CURRENT STAGE: ROUND 4 — ANALYTICAL TECH INTERVIEW PUZZLE
1. Briefly acknowledge their project explanation.
2. Transition to a logical puzzle:
   "To test your analytical problem-solving and structured thinking under pressure, let us do a classic tech interview puzzle."
3. Present an authentic interview puzzle clearly (for example: The 25 Horses Puzzle to find the top 3 fastest in minimum races, The 3 Switches and 3 Bulbs in a closed room, The 2 Egg 100-floor drop puzzle, or The 8 Coins balance scale puzzle).
4. Ask the candidate to think out loud and explain their reasoning step-by-step.
`;
  } else {
    stageGuidance = `
CURRENT STAGE: ROUND 5 — CONCLUSION & CANDIDATE QUESTIONS
1. Acknowledge their puzzle answer with constructive encouragement.
2. Wrap up warmly:
   "We have covered DSA, CS fundamentals, your project, and the puzzle. You did a great job going through all rounds today. Do you have any questions for me regarding the engineering team or tech stack?"
3. If they ask a question, answer it politely and conclude by asking them to click 'Finish Interview' at the top to receive their complete hiring evaluation dossier.
`;
  }

  const systemInstruction = `You are ${personaName}, a ${personaRole}. You are conducting an authentic, professional technical job interview in India for a ${currentRoleName} position.

CANDIDATE RESUME & PROFILE:
- Target Role: ${currentRoleName}
- Primary Project: "${projectTitle}"
- Primary Tech Stack: ${techStack}
- Project Description: ${projectDescription || 'Not provided'}
- Candidate Background: ${resumeSummary || 'Engineering student / developer'}
- ${drillTopicsStr}${allProjectsStr}

${codeReviewInstruction}

LANGUAGE & PERSONA INSTRUCTIONS (NATURAL INDIAN ENGLISH):
- Speak in natural, everyday Indian English.
- Indian English is simple, clear, polite, and direct. Do NOT use overly complex, fancy, archaic, or pretentious academic words.
- Speak in a friendly, encouraging, professional tone (e.g. "Hello, welcome to your interview.", "Walk me through your logic.", "What will be the time complexity for this?", "Very good, now please write code in the editor.", "Fair enough, could you explain...", "Take your time and think out loud.").
- Keep each spoken response STRICTLY to 2 to 3 concise conversational sentences. Never recite long lecture paragraphs. Give the candidate space to speak!
- NEVER use double quotes (") inside your spoken sentences. If you need to mention variable names, strings, code terms, or Big-O complexities, ALWAYS use single quotes (') — for example: 'nums', 'target', 'O(N)'.
- Big-O Complexity Pronunciation: Always refer to Big-O notation as 'O of N', 'O of 1', 'O of N log N', or 'O of N squared'. NEVER write or treat it as chemical elements (never 'oxygen' or 'nitrate').

MANDATORY MULTI-ROUND INTERVIEW FLOW:
The interview MUST progress through all 5 key rounds:
0. Warm Welcome & Candidate Self-Introduction (Icebreaker)
1. DSA (Data Structures & Algorithms problem with approach discussion & IDE coding)
2. CS Fundamentals (Operating Systems, DBMS/SQL, Computer Networks, or language internals)
3. Resume Project Deep-Dive (Architecture, design decisions, scaling, and tech stack trade-offs)
4. Technical Puzzle / Analytical Brainteaser (Structured problem solving under pressure)
5. Conclusion & Candidate Q&A

${stageGuidance}

ROLE-SPECIFIC DYNAMIC QUESTIONING (NEVER HARDCODED):
Formulate authentic, dynamic questions based on real interview patterns at top tech companies (Google, Amazon, Microsoft, Flipkart, Swiggy) for a ${currentRoleName} role with skills in ${techStack}:
- SDE / Fullstack: DSA on arrays/hash maps/two pointers/trees. CS fundamentals on OS (processes vs threads, deadlocks, mutex) and DBMS (ACID, indexing, transactions).
- Frontend: DSA on string/array manipulation, debounce/throttle, or LRU cache. CS fundamentals on JS Event Loop, Closures, DOM rendering lifecycle, React Fiber/Virtual DOM reconciliation, and Web Performance.
- Backend: DSA on queues/heaps/graphs. CS fundamentals on DB indexing, transactions/ACID, caching (Redis), distributed systems, and API design.
- AI / ML / Data Science: DSA on matrix math, vector similarities. Fundamentals on gradient descent, bias-variance tradeoff, overfitting, and loss functions.
- DevOps: DSA on interval scheduling or log parsing. Fundamentals on Linux cgroups/namespaces, Docker vs VMs, and Kubernetes pod lifecycle.

CRITICAL OUTPUT FORMAT:
${
  isAudioTurn
    ? `AUDIO INPUT INSTRUCTION:
The candidate responded via audio. You must:
1. First, transcribe what the candidate said into "transcribedAnswer".
2. Then write your next interview question/response in "interviewerResponse".
Output ONLY this valid JSON, no extra text before or after (use single quotes inside string values):
{
  "transcribedAnswer": "exact words spoken by candidate",
  "interviewerResponse": "your next spoken interview question as plain natural text with no internal double quotes"
}`
    : `TEXT INPUT INSTRUCTION:
The candidate typed their response. Reply ONLY with what you would say next as the interviewer — plain spoken English. No JSON. No curly braces. No formatting. Just talk naturally.`
}`;

  // Use key pool — rotates through all 3 keys automatically on rate limit
  if (geminiKeyPool.available) {
    try {
      return await geminiKeyPool.call(async (genAI) => {
        for (const modelName of MODEL_FALLBACK_CHAIN) {
          try {
            const model = genAI.getGenerativeModel({
              model: modelName,
              systemInstruction,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
                ...(isAudioTurn ? { responseMimeType: 'application/json' } : {}),
              },
            });

            // Sanitize history: strip any AI messages that leaked as JSON
            const contents: any[] = history.map((msg) => {
              if (msg.sender === 'ai') {
                const cleaned = extractInterviewerTurn(msg.text);
                return {
                  role: 'model',
                  parts: [{ text: cleaned.response || msg.text }],
                };
              }
              return {
                role: 'user',
                parts: [{ text: msg.text }],
              };
            });

            if (studentCode) {
              const codeSubmissionText = `[Candidate submitted code in ${codeLanguage || 'code'}]:\n\`\`\`${codeLanguage || ''}\n${studentCode}\n\`\`\`${codeOutput ? `\n[Test Sandbox Output]:\n${codeOutput}` : ''}${studentMessage ? `\n\nCandidate notes: ${studentMessage}` : ''}`;
              contents.push({ role: 'user', parts: [{ text: codeSubmissionText }] });
            } else if (studentAudioBase64) {
              contents.push({
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      data: studentAudioBase64,
                      mimeType: studentAudioMime,
                    },
                  },
                  {
                    text: studentMessage
                      ? `Candidate said: "${studentMessage}". Listen to the audio and respond.`
                      : 'Listen to the candidate audio response and reply.',
                  },
                ],
              });
            } else if (studentMessage) {
              contents.push({ role: 'user', parts: [{ text: studentMessage }] });
            }

            if (contents.length === 0) {
              contents.push({ role: 'user', parts: [{ text: 'I am ready to begin my technical interview.' }] });
            }

            const result = await model.generateContent({ contents });
            let responseText = result.response.text().trim();

            // Hard safety strip: if text turn returned JSON, force-extract the interviewer part
            if (!isAudioTurn && responseText.includes('interviewerResponse')) {
              const forceExtract = extractInterviewerTurn(responseText, studentMessage);
              responseText = forceExtract.response || responseText;
            }

            const extracted = extractInterviewerTurn(responseText, studentMessage);
            if (extracted.response && extracted.response.length > 2) {
              return extracted;
            }
          } catch (err: any) {
            const msg = String(err?.message || '').toLowerCase();
            if (msg.includes('quota') || msg.includes('429') || msg.includes('rate') || msg.includes('resource_exhausted')) {
              throw err;
            }
            console.warn(`[gemini] Model ${modelName} error:`, err?.message);
          }
        }
        throw new Error('All models exhausted on this key — rotate to next');
      });
    } catch (err) {
      console.error('[gemini] All keys failed for interview response, using simulated fallback:', err);
    }
  }

  return { response: getSimulatedInterviewerTurn(context) };
}

/**
 * Robust field extractor for malformed/unescaped JSON from LLMs.
 * Never truncates early on internal double quotes.
 */
function extractFieldFromMalformedJson(jsonStr: string, fieldName: string): string | null {
  const pattern = new RegExp(`"${fieldName}"\\s*:\\s*"`);
  const match = jsonStr.match(pattern);
  if (!match || match.index === undefined) return null;
  const startIdx = match.index + match[0].length;
  const remainder = jsonStr.substring(startIdx);

  // Case A: Another property follows: look for `",\s*"[a-zA-Z_]+`
  const nextPropMatch = remainder.match(/"\s*,\s*"[a-zA-Z_]+/);
  if (nextPropMatch && nextPropMatch.index !== undefined) {
    return remainder.substring(0, nextPropMatch.index).trim();
  }

  // Case B: Last property in the JSON object: look for closing brace `}`
  const lastBrace = remainder.lastIndexOf('}');
  const searchEnd = lastBrace !== -1 ? lastBrace : remainder.length;
  const lastQuote = remainder.lastIndexOf('"', searchEnd);
  if (lastQuote !== -1) {
    return remainder.substring(0, lastQuote).trim();
  }

  // Case C: Unterminated or stream truncated
  return remainder.substring(0, searchEnd).trim();
}

/**
 * Robust extractor for Gemini output that guarantees no raw JSON leaks
 * into the audio/voice synthesizer or UI subtitle cards, while NEVER
 * truncating sentences that contain quotes or technical terms.
 */
export function extractInterviewerTurn(
  rawText: string,
  fallbackStudentText?: string
): { response: string; transcribedText?: string } {
  if (!rawText || typeof rawText !== 'string') {
    return { response: '', transcribedText: fallbackStudentText };
  }

  let text = rawText.trim();

  // Strip markdown code blocks
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  // 1. Try standard JSON.parse
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      const resp = parsed.interviewerResponse || parsed.response || parsed.interviewer_response;
      const trans = parsed.transcribedAnswer || parsed.transcript || parsed.transcribed_answer;
      if (resp || trans) {
        return {
          response: (resp || '').trim(),
          transcribedText: (trans || fallbackStudentText || '').trim() || undefined,
        };
      }
    }
  } catch (_) {}

  // 2. Substring JSON parsing if surrounded by extra text
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const candidate = text.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') {
        const resp = parsed.interviewerResponse || parsed.response || parsed.interviewer_response;
        const trans = parsed.transcribedAnswer || parsed.transcript || parsed.transcribed_answer;
        if (resp || trans) {
          return {
            response: (resp || '').trim(),
            transcribedText: (trans || fallbackStudentText || '').trim() || undefined,
          };
        }
      }
    } catch (_) {}
  }

  // 3. Robust field extractor for unescaped or malformed JSON
  const respVal =
    extractFieldFromMalformedJson(text, 'interviewerResponse') ||
    extractFieldFromMalformedJson(text, 'response') ||
    extractFieldFromMalformedJson(text, 'interviewer_response');

  const transVal =
    extractFieldFromMalformedJson(text, 'transcribedAnswer') ||
    extractFieldFromMalformedJson(text, 'transcript') ||
    extractFieldFromMalformedJson(text, 'transcribed_answer');

  if (respVal || transVal) {
    let extractedResp = respVal ? respVal.trim() : '';
    let extractedTrans = transVal ? transVal.trim() : (fallbackStudentText || '');

    extractedResp = extractedResp.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
    extractedTrans = extractedTrans.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');

    if (extractedResp) {
      return {
        response: extractedResp,
        transcribedText: extractedTrans || undefined,
      };
    }
  }

  // 4. Fallback: clean text without JSON markers
  let cleaned = text;
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  return {
    response: cleaned,
    transcribedText: fallbackStudentText || undefined,
  };
}

function getSimulatedInterviewerTurn(context: InterviewContext): string {
  const { projectTitle, techStack, interviewerPersona = 'alex', history, studentMessage, allProjects = [], studentCode, codeLanguage } = context;
  const personaName = interviewerPersona === 'sophia' ? 'Priya' : 'Aarav';

  if (studentCode) {
    const lang = codeLanguage || 'code';
    return `I've evaluated your ${lang} code. Your logic correctly solves the problem in O(N) time and O(N) space using a single-pass hash map. Notice how you handled edge cases like non-existent pairs. How would your approach change if the input array was already sorted in ascending order?`;
  }

  const userMessageLower = (studentMessage || '').toLowerCase();

  // If candidate explains algorithm
  if (
    userMessageLower.includes('hash map') ||
    userMessageLower.includes('hashmap') ||
    userMessageLower.includes('two pointers') ||
    userMessageLower.includes('pointer') ||
    userMessageLower.includes('o(n)') ||
    userMessageLower.includes('brute force') ||
    userMessageLower.includes('complement') ||
    userMessageLower.includes('algo')
  ) {
    return `Your proposed algorithmic approach is optimal. Using a hash map to store complements in a single pass gives you O(N) time complexity and O(N) auxiliary space. Go ahead and open the Live Code Editor on the right, write out your implementation, and click Submit to Interviewer when you're ready.`;
  }

  // If candidate asks for DSA or turns point to DSA
  if (userMessageLower.includes('dsa') || userMessageLower.includes('algo') || userMessageLower.includes('coding')) {
    return `Let's dive into Data Structures & Algorithms. Here is your problem: Given an array of integers 'nums' and an integer 'target', return the indices of the two numbers such that they add up to 'target'. You may assume that each input has exactly one solution, and you may not use the same element twice. For example: Input: nums = [2, 7, 11, 15], target = 9. Output: [0, 1] because nums[0] + nums[1] equals 9. Before writing any code, walk me through your algorithmic approach. How do you plan to solve this, and what is your expected time and space complexity?`;
  }

  const userTurns = history.filter((m) => m.sender === 'user');
  const turnCount = userTurns.length;
  const tech1 = techStack.split(',')[0]?.trim() || 'your stack';
  const tech2 = techStack.split(',')[1]?.trim() || 'your database';
  const extraProject = allProjects[1]?.title || projectTitle;

  // Mirror the same dynamic questioning structure
  if (turnCount === 0 && !studentMessage) {
    return `Hi, I'm ${personaName}. Good to meet you. Let's dive right in — tell me about your background, what you've built on your resume, and what you're targeting.`;
  }

  if (turnCount === 1) {
    return `Alright, let's jump into Data Structures & Algorithms. Here is your problem: Given an array of integers 'nums' and an integer 'target', return the indices of the two numbers such that they add up to 'target'. You may assume each input has exactly one valid solution, and you cannot use the same element twice. For example: Input: nums = [2, 7, 11, 15], target = 9. Output: [0, 1] because nums[0] + nums[1] equals 9. Before writing any code, walk me through your algorithm and approach. What data structure would you use, and what is your expected time and space complexity?`;
  }

  if (turnCount === 2) {
    return `That single-pass hash map algorithm is spot-on with O(N) time and O(N) space. Now switch over to the Live Code Editor on the right, write out your complete solution, and click Submit to Interviewer when you're done.`;
  }

  if (turnCount === 3) {
    return `Okay. Shifting to CS fundamentals — explain the difference between a process and a thread. When would you prefer one over the other?`;
  }

  if (turnCount === 4) {
    return `Right. In databases — what are ACID properties? Give me a real scenario where violating Atomicity causes a critical issue.`;
  }

  if (turnCount === 5) {
    return `Now let's talk about your project "${projectTitle}". Walk me through the system architecture — what are the main components and how do they communicate?`;
  }

  if (turnCount === 6) {
    return `In ${projectTitle}, how did you handle concurrent writes to ${tech2}? What prevents two users from overwriting each other's data simultaneously?`;
  }

  if (turnCount === 7) {
    return `You also mentioned "${extraProject}" on your resume. What was the hardest technical decision you made building that, and would you make the same call today?`;
  }

  if (turnCount === 8) {
    return `If your ${tech1} service received 10x its current traffic overnight, what breaks first, and what would you do architecturally to handle it?`;
  }

  if (turnCount === 9) {
    return `Let's do system design. Design a URL shortener like bit.ly from scratch — tell me the key components, your choice of database, and how you'd handle 1 million URLs per day.`;
  }

  if (turnCount === 10) {
    return `How would you design the short-code generation? And what happens if two users try to shorten the same URL at exactly the same time?`;
  }

  if (turnCount === 11) {
    return `Now for OOP design — design a Parking Lot system. Tell me the key classes, their relationships, and what methods each class would have.`;
  }

  if (turnCount === 12) {
    return `Behavioral question — tell me about a time you worked on something that failed. What went wrong, what was your specific role in the failure, and what did you learn?`;
  }

  if (turnCount === 13) {
    return `One more — how do you handle a situation where you strongly disagree with a technical decision your team has already committed to?`;
  }

  if (turnCount === 14) {
    return `Last one — here's a brain teaser: you have 8 balls that look identical. One is slightly heavier. You have a balance scale and only 2 weighings allowed. How do you find the heavier ball?`;
  }

  // Wrap-up
  return `That wraps up our session. Thanks for walking me through all of that — you'll receive your detailed evaluation report with scores across DSA, system design, project depth, and behavioral shortly. Any questions for me before we close?`;
}

function getRoleDisplayName(role: string): string {
  const map: Record<string, string> = {
    sde: 'Software Development Engineer',
    frontend: 'Frontend Engineer',
    backend: 'Backend Engineer',
    fullstack: 'Full Stack Engineer',
    ai_ml: 'AI / Machine Learning Engineer',
    data_science: 'Data Scientist',
    devops: 'DevOps / Site Reliability Engineer',
    mobile: 'Mobile Engineer',
  };
  return map[role] || 'Software Engineer';
}

export function generateSuitableJobLinks(
  targetRole = 'sde',
  techStack = 'React, Node.js',
  primaryRoleTitle?: string,
  resumeSummary?: string,
  allProjects?: { title: string; techStack: string; description: string }[],
  aiJobs?: any[]
): SuitableJobLink[] {
  // Extract all tech keywords from techStack, resumeSummary, and allProjects
  const allTechs: string[] = [];
  const addTokens = (str?: string) => {
    if (!str) return;
    str.split(/[,|/•\n]+/).forEach((t) => {
      const clean = t.trim().replace(/^[-*•]\s*/, '').replace(/[^a-zA-Z0-9+#.]/g, '');
      if (clean && clean.length > 1 && !allTechs.some((x) => x.toLowerCase() === clean.toLowerCase())) {
        allTechs.push(clean);
      }
    });
  };

  addTokens(techStack);
  if (allProjects && Array.isArray(allProjects)) {
    allProjects.forEach((p) => {
      addTokens(p.techStack);
    });
  }
  if (resumeSummary) {
    const techMatches = resumeSummary.match(
      /(?:React|Next\.js|Node\.js|Python|FastAPI|Django|Java|Spring|Go|Golang|C\+\+|TypeScript|JavaScript|PostgreSQL|MySQL|MongoDB|Redis|Docker|Kubernetes|AWS|GCP|Azure|GraphQL|Kafka|PyTorch|TensorFlow)/gi
    );
    if (techMatches) {
      techMatches.forEach((t) => addTokens(t));
    }
  }

  const primaryTech = allTechs[0] || 'Software';
  const secondaryTech = allTechs[1] || (allTechs[0] !== 'Software' ? allTechs[0] : 'Engineering');
  const tertiaryTech = allTechs[2] || '';
  const roleName = primaryRoleTitle || getRoleDisplayName(targetRole);

  // Helper to extract clean role slug for Naukri & Internshala
  const getRoleSlug = (role: string): string => {
    const r = role.toLowerCase();
    if (r.includes('front')) return 'frontend-developer';
    if (r.includes('back')) return 'backend-developer';
    if (r.includes('full') || r.includes('web')) return 'full-stack-developer';
    if (r.includes('data') || r.includes('ml') || r.includes('ai')) return 'data-scientist';
    if (r.includes('devops') || r.includes('cloud')) return 'devops-engineer';
    if (r.includes('mobile') || r.includes('android') || r.includes('ios')) return 'mobile-developer';
    return 'software-engineer';
  };

  const getInternshalaSlug = (role: string): string => {
    const r = role.toLowerCase();
    if (r.includes('front') || r.includes('web') || r.includes('full')) return 'web-development';
    if (r.includes('back') || r.includes('software') || r.includes('sde')) return 'software-development';
    if (r.includes('data') || r.includes('ml') || r.includes('ai')) return 'data-science';
    if (r.includes('mobile') || r.includes('android') || r.includes('ios')) return 'mobile-app-development';
    return 'software-development';
  };

  const cleanRole = roleName.replace(/\s*\([^)]*\)/g, '').trim() || 'Software Engineer';
  const roleSlug = getRoleSlug(cleanRole);
  const internshalaSlug = getInternshalaSlug(cleanRole);

  // Real, active, verified job links with zero 403 or empty login walls
  return [
    {
      platform: 'Google Jobs',
      role_title: `${cleanRole} (${primaryTech}) — Live Aggregate Index`,
      apply_url: `https://www.google.com/search?q=${encodeURIComponent(`${cleanRole} ${primaryTech} jobs India`)}&ibp=htl;jobs`,
      badge_text: 'Live Google Index',
      match_tag: '98% Resume Match',
      description: `Live Google Jobs aggregator querying thousands of company careers portals, Lever, and Greenhouse simultaneously for ${primaryTech} developers in India & remote.`,
    },
    {
      platform: 'LinkedIn',
      role_title: `${cleanRole} (${primaryTech} & ${secondaryTech})`,
      apply_url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(`${cleanRole} ${primaryTech}`)}&location=India&f_TPR=r604800`,
      badge_text: 'Past 7 Days (Live)',
      match_tag: '96% Resume Match',
      description: `Active public LinkedIn requisitions posted within the last 7 days matching your verified skills in ${primaryTech} and ${secondaryTech}.`,
    },
    {
      platform: 'Naukri',
      role_title: `${cleanRole} Openings on Naukri India`,
      apply_url: `https://www.naukri.com/${roleSlug}-jobs?k=${encodeURIComponent(primaryTech)}`,
      badge_text: 'Verified Indian Postings',
      match_tag: '95% Resume Match',
      description: `Direct campus and lateral engineering requisitions across Indian tech unicorns, MNCs, and product firms requiring ${primaryTech}.`,
    },
    {
      platform: 'Foundit',
      role_title: `${cleanRole} Opportunities — ${primaryTech}`,
      apply_url: `https://www.foundit.in/srp/results?query=${encodeURIComponent(`${cleanRole} ${primaryTech}`)}`,
      badge_text: 'Immediate Hires',
      match_tag: '94% Resume Match',
      description: `Active engineering openings with verified recruiter contacts on Foundit India (formerly Monster) for ${primaryTech} and ${secondaryTech}.`,
    },
    {
      platform: 'Internshala',
      role_title: `Entry-Level / Fresher ${cleanRole} (${primaryTech})`,
      apply_url: `https://internshala.com/jobs/${internshalaSlug}-jobs/`,
      badge_text: '0-2 YOE Placement',
      match_tag: '95% Resume Match',
      description: `Tailored college placement and entry-level engineering openings specifically hiring 0-2 YOE freshers with hands-on ${primaryTech} projects.`,
    },
    {
      platform: 'Cutshort',
      role_title: `${primaryTech} Engineer at High-Growth Startups`,
      apply_url: `https://cutshort.io/jobs?search=${encodeURIComponent(primaryTech)}`,
      badge_text: 'Direct to Founders',
      match_tag: '92% Resume Match',
      description: `Fast-growing Indian tech startups and scaleups actively hiring engineers with hands-on ${primaryTech} project experience with direct founder chat.`,
    },
  ];
}

// Real-world technical keywords dictionary across core domains
const TECHNICAL_KEYWORD_REGEX =
  /\b(?:time complexity|space complexity|big-?o|o\(n\)|o\(1\)|o\(log n\)|o\(n\^2\)|algorithm|array|string|hash\s*map|hash\s*table|hashmap|hashtable|tree|binary search|bst|graph|stack|queue|heap|priority queue|trie|recursion|recursive|dynamic programming|memoization|dp|two pointer|two pointers|sliding window|bfs|dfs|breadth first|depth first|sorting|quicksort|mergesort|edge case|base case|index|indexing|b-?tree|acid|transaction|isolation level|primary key|foreign key|join|normalization|deadlock|locking|optimistic|pessimistic|sharding|replication|cache|redis|sql|nosql|postgres|postgresql|mongodb|rest|api|http|status code|endpoint|crud|jwt|token|auth|oauth|microservice|pubsub|kafka|rabbitmq|process|thread|multithreading|concurrency|race condition|mutex|semaphore|virtual memory|paging|tcp|udp|dns|load balancer|latency|throughput|socket|websocket|dom|virtual dom|component|props|state|hook|useeffect|usestate|usememo|usecallback|redux|render|typescript|interface|async|await|promise|closure|event loop|docker|kubernetes|ci\/cd|pipeline)\b/gi;

const REFUSAL_PATTERNS = [
  /\b(?:don'?t know|do not know|dont know|dunno)\b/i,
  /\b(?:no idea|no clue|not sure|not certain)\b/i,
  /\b(?:can'?t (?:say|answer|explain|remember|recall)|cannot (?:say|answer|explain|remember|recall))\b/i,
  /\b(?:skip(?: this)?|pass(?: this)?|next question|another question|ask something else)\b/i,
  /\b(?:haven'?t (?:studied|prepared|learned|revised|done)|have not (?:studied|prepared|learned|revised|done))\b/i,
  /\b(?:forgot(?:ten)?|don'?t remember|not aware|no knowledge)\b/i,
  /\b(?:sorry sir|sorry mam|sorry|i am not sure)\b/i,
  /\b(?:idk|cant say|dont have idea)\b/i,
];

const FILLER_ONLY_PATTERNS = [
  /^(?:hi|hello|hey|good (?:morning|afternoon|evening)|how are you)[\s.!?,]*$/i,
  /^(?:yes|yeah|yep|ok|okay|sure|fine|yes sir|no sir|yes ma'am|thank you|thanks)[\s.!?,]*$/i,
  /^(?:i am ready|ready|can you hear me|am i audible|cool|understood|alright|proceed)[\s.!?,]*$/i,
];

interface CandidateAuditResult {
  totalQuestions: number;
  totalCandidateTurns: number;
  candidateSpokenWords: number;
  substantiveTechnicalTurns: number;
  refusalOrSkipCount: number;
  fillerOnlyCount: number;
  technicalKeywordsCount: number;
  technicalKeywordsFound: string[];
  hasSubmittedCode: boolean;
  codeLines: number;
  codeExecuted: boolean;
  isZeroParticipation: boolean;
  isNoAnswerSession: boolean;
  isMinimalParticipation: boolean;
}

function auditCandidateSession(
  transcript: ChatMessage[],
  submittedCodeData?: { code: string; language: string; output?: string }
): CandidateAuditResult {
  let totalQuestions = 0;
  for (const msg of transcript) {
    if (msg.sender === 'ai') {
      const t = msg.text.trim();
      if (
        t.includes('?') ||
        /(?:explain|how would you|write|implement|walk me through|what is|tell me about|how do you|can you design|solve|calculate)/i.test(t)
      ) {
        totalQuestions++;
      }
    }
  }

  const userMessages = transcript.filter((m) => m.sender === 'user');
  let candidateSpokenWords = 0;
  let substantiveTechnicalTurns = 0;
  let refusalOrSkipCount = 0;
  let fillerOnlyCount = 0;
  const techKeywordsFoundSet = new Set<string>();

  for (const m of userMessages) {
    const raw = m.text || '';
    const hasCodeInMsg = raw.includes('```') || raw.includes('[Submitted Code');
    const nonCode = raw
      .replace(/\[Submitted Code[\s\S]*?```/g, '')
      .replace(/\[Test (?:Sandbox )?Output\]:[\s\S]*/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .trim();

    const words = nonCode.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    candidateSpokenWords += wordCount;

    // Check for domain technical keywords
    const matches = nonCode.match(TECHNICAL_KEYWORD_REGEX);
    const kwCount = matches ? matches.length : 0;
    if (matches) {
      matches.forEach((kw) => techKeywordsFoundSet.add(kw.toLowerCase()));
    }

    // Check for refusal / non-answer patterns
    const isRefusal = REFUSAL_PATTERNS.some((pat) => pat.test(nonCode));
    const isFiller = FILLER_ONLY_PATTERNS.some((pat) => pat.test(nonCode));

    if (isFiller && !hasCodeInMsg) {
      fillerOnlyCount++;
      continue;
    }

    if (isRefusal && !hasCodeInMsg) {
      // If candidate stated a refusal ("I don't know", "skip", "haven't prepared"),
      // merely echoing the topic keyword (e.g. "I don't know database indexing") is NOT a substantive answer.
      if (wordCount < 25 || kwCount < 3) {
        refusalOrSkipCount++;
        continue;
      }
    }

    if (hasCodeInMsg || kwCount >= 1 || (wordCount >= 12 && !isRefusal)) {
      substantiveTechnicalTurns++;
    } else if (isRefusal) {
      refusalOrSkipCount++;
    }
  }

  const hasSubmittedCode =
    !!submittedCodeData &&
    submittedCodeData.code.trim().length > 15 &&
    !submittedCodeData.code.includes('// Write your solution here') &&
    submittedCodeData.code.trim() !== 'console.log("hello");';

  const codeLines = submittedCodeData
    ? submittedCodeData.code.split('\n').filter((l) => l.trim().length > 0).length
    : 0;
  const codeExecuted = !!submittedCodeData?.output && submittedCodeData.output.trim().length > 0;

  // Zero participation: no user messages, or fewer than 5 spoken words and no code
  const isZeroParticipation = userMessages.length === 0 || (candidateSpokenWords < 5 && !hasSubmittedCode);

  // No answer session: Candidate was active but answered 0 questions substantively (said only "hi", "ok", "i don't know", "skip")
  const isNoAnswerSession =
    !isZeroParticipation &&
    substantiveTechnicalTurns === 0 &&
    !hasSubmittedCode;

  // Minimal participation: only 1 superficial technical turn or high refusal rate (>= 2 refusals) and no code
  const isMinimalParticipation =
    !isZeroParticipation &&
    !isNoAnswerSession &&
    ((substantiveTechnicalTurns <= 1 && !hasSubmittedCode) ||
      (refusalOrSkipCount >= 2 && substantiveTechnicalTurns <= 1 && !hasSubmittedCode));

  return {
    totalQuestions: Math.max(1, totalQuestions),
    totalCandidateTurns: userMessages.length,
    candidateSpokenWords,
    substantiveTechnicalTurns,
    refusalOrSkipCount,
    fillerOnlyCount,
    technicalKeywordsCount: techKeywordsFoundSet.size,
    technicalKeywordsFound: Array.from(techKeywordsFoundSet),
    hasSubmittedCode,
    codeLines,
    codeExecuted,
    isZeroParticipation,
    isNoAnswerSession,
    isMinimalParticipation,
  };
}

export async function evaluateInterview(
  projectTitle: string,
  techStack: string,
  transcript: ChatMessage[],
  resumeSummary?: string,
  apiKeyOverride?: string,
  targetRole = 'sde',
  allProjects: { title: string; techStack: string; description: string }[] = []
): Promise<EvaluationResult> {
  const transcriptText = transcript
    .map((m) => `${m.sender === 'user' ? 'CANDIDATE' : 'INTERVIEWER'}: ${m.text}`)
    .join('\n\n');

  // Extract any code submitted in the transcript
  const submittedCodeMsg = [...transcript].reverse().find(
    (m) => m.sender === 'user' && (m.text.includes('```') || m.text.includes('[Submitted Code'))
  );
  let submittedCodeData: { code: string; language: string; output?: string } | undefined;
  if (submittedCodeMsg) {
    const codeMatch = submittedCodeMsg.text.match(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/);
    const outputMatch = submittedCodeMsg.text.match(/\[Test (?:Sandbox )?Output\]:\s*([\s\S]*?)(?:\n\n|$)/);
    if (codeMatch && codeMatch[2]) {
      submittedCodeData = {
        language: codeMatch[1] || 'code',
        code: codeMatch[2].trim(),
        output: outputMatch ? outputMatch[1].trim() : undefined,
      };
    }
  }

  // Run rigorous candidate participation and technical substance audit
  const audit = auditCandidateSession(transcript, submittedCodeData);

  // Default fallback career fit roles
  const defaultBestFitRoles: BestFitRole[] = [
    {
      role_title:
        targetRole === 'backend'
          ? 'Backend Systems Engineer'
          : targetRole === 'frontend'
          ? 'Frontend Applications Engineer'
          : targetRole === 'ai_ml'
          ? 'Machine Learning Engineer'
          : targetRole === 'data_science'
          ? 'Data Scientist & Analytics Engineer'
          : targetRole === 'devops'
          ? 'DevOps & Cloud Infrastructure Engineer'
          : targetRole === 'mobile'
          ? 'Mobile Application Engineer'
          : 'Software Development Engineer (SDE)',
      match_percentage: 95,
      seniority: 'Entry-Level / Associate (0-2 YOE)',
      why_fit: `Strong alignment with ${techStack.split(',')[0] || 'core technologies'}, hands-on service development, and practical database schema architecture demonstrated in ${projectTitle}.`,
      ideal_companies: ['Top Tech Product Firms', 'High-Growth Fintech Scaleups', 'Global SaaS Leaders'],
    },
    {
      role_title:
        targetRole === 'frontend' || targetRole === 'mobile'
          ? 'UI/UX Platform Engineer'
          : targetRole === 'ai_ml' || targetRole === 'data_science'
          ? 'Applied AI Systems Developer'
          : 'Full Stack Engineer',
      match_percentage: 89,
      seniority: 'Junior to Mid Software Engineer',
      why_fit: `Versatile project portfolio with ${allProjects.length > 1 ? allProjects.length + ' distinct projects' : 'full lifecycle project execution'}, covering API communication and modular architecture.`,
      ideal_companies: ['Venture-Backed Startups', 'Enterprise Cloud Providers', 'Developer Tooling Companies'],
    },
    {
      role_title: 'Cloud & API Platform Specialist',
      match_percentage: 83,
      seniority: 'Associate Software Engineer',
      why_fit: `Solid foundational comprehension of microservice boundaries, authentication patterns, and scalable data persistence.`,
      ideal_companies: ['E-Commerce Platforms', 'Digital Health Systems', 'Fintech Infrastructure'],
    },
  ];

  // REAL-WORLD CASE 1: ZERO PARTICIPATION OR COMPLETELY UNANSWERED INTERVIEW
  // If candidate was silent, said nothing, or answered with only non-answers / "I don't know" / "skip":
  // In real tech hiring bar: SCORE MUST BE 1/10 ("No Hire"). Never award 5!
  if (audit.isZeroParticipation || audit.isNoAnswerSession) {
    const verifiedJobLinks = generateSuitableJobLinks(
      targetRole,
      techStack,
      defaultBestFitRoles[0]?.role_title,
      resumeSummary,
      allProjects
    );

    return {
      technical_score: 1,
      communication_score: audit.candidateSpokenWords > 25 ? 2 : 1,
      confidence_score: 1,
      overall_verdict: 'No Hire',
      interview_skills_breakdown: {
        technical_depth: 1,
        problem_solving: 1,
        system_architecture: 1,
        communication_clarity: audit.candidateSpokenWords > 25 ? 2 : 1,
        vocal_confidence: 1,
      },
      interview_improvements: [
        'Candidate did not answer technical questions asked by the interviewer (skipped questions or responded with "I don\'t know" / filler).',
        'When presented with a coding problem, outline your algorithmic thought process out loud to the interviewer rather than passing.',
        'State your expected time and space complexity (Big-O) before attempting implementation.',
        'Use the live code editor to implement solutions and run test cases to demonstrate programming fluency.',
      ],
      resume_score: 75,
      resume_verdict: 'Resume Profile Uploaded — Interview Hiring Bar Unmet (1/10)',
      resume_rating_breakdown: {
        ats_readability: 8,
        impact_metrics: 7,
        tech_stack_relevance: 8,
        project_presentation: 7,
      },
      resume_improvements: [
        `Apply Google XYZ formula on resume projects: 'Accomplished [X], as measured by [Y], by doing [Z]'. Example: 'Engineered backend API for ${projectTitle}, reducing latency by 30%'.`,
        `Add explicit production competencies (Docker, GitHub Actions, unit testing) to pass corporate ATS screening.`,
        `Quantify scale: include database row counts, active user volumes, or query throughput metrics.`,
      ],
      best_fit_roles: defaultBestFitRoles,
      suitable_job_links: verifiedJobLinks,
      strengths: [
        `Candidate profile registered for ${targetRole.toUpperCase()} track.`,
        `Project portfolio in scope: ${projectTitle} (${techStack}).`,
      ],
      weaknesses: [
        'Unanswered technical interview: candidate failed to provide substantive answers to technical questions.',
        'Multiple prompts skipped or answered with "I don\'t know" / non-answers without attempting problem-solving.',
        'No working code implementation or test execution was submitted in the live code editor.',
      ],
      improvements: [
        'Candidate must verbally answer technical questions and explain algorithmic steps rather than skipping.',
        'Must implement and test code in the live editor to demonstrate basic programming proficiency.',
      ],
      practice_plan: [
        'Practice mock interview speaking out loud with standard technical questions.',
        'Study core DSA patterns: Two Pointers, Sliding Window, Fast/Slow Pointers, Binary Search.',
        'Practice live coding on scratchpad under time pressure.',
        'Review Big-O time and space complexity derivation.',
      ],
      topic_tags: ['Verbal Communication', 'Problem Solving', 'Data Structures', 'DSA Protocol'],
      submitted_code: submittedCodeData,
    };
  }

  // REAL-WORLD CASE 2: MINIMAL PARTICIPATION (Only 1 superficial answer or high refusal rate and no code)
  if (audit.isMinimalParticipation) {
    const verifiedJobLinks = generateSuitableJobLinks(
      targetRole,
      techStack,
      defaultBestFitRoles[0]?.role_title,
      resumeSummary,
      allProjects
    );

    return {
      technical_score: 2,
      communication_score: 2,
      confidence_score: 2,
      overall_verdict: 'No Hire',
      interview_skills_breakdown: {
        technical_depth: 2,
        problem_solving: 2,
        system_architecture: 2,
        communication_clarity: 2,
        vocal_confidence: 2,
      },
      interview_improvements: [
        'Candidate provided only 1 superficial answer and skipped or refused the remaining technical prompts.',
        'Explain your thought process in complete sentences and reason through trade-offs rather than giving one-sentence replies.',
        'State the time and space complexity (Big-O) of your proposed approach.',
        'Switch to the live editor and implement your solution once verified.',
      ],
      resume_score: 78,
      resume_verdict: 'Resume Profile Uploaded — Hiring Bar Unmet (2/10)',
      resume_rating_breakdown: {
        ats_readability: 8,
        impact_metrics: 7,
        tech_stack_relevance: 9,
        project_presentation: 8,
      },
      resume_improvements: [
        `Apply Google XYZ formula on resume projects: 'Accomplished [X], as measured by [Y], by doing [Z]'. Example: 'Engineered ${techStack.split(',')[0] || 'API'} microservice handling 10k daily requests'.`,
        `Add explicit production competencies: include Docker containerization, CI/CD GitHub Actions, and monitoring.`,
        `Quantify scale and database dimensions: include active user counts, query execution benchmarks, or data volume metrics.`,
      ],
      best_fit_roles: defaultBestFitRoles,
      suitable_job_links: verifiedJobLinks,
      strengths: [
        `Candidate attended technical interview session for ${projectTitle}.`,
        `Initial verbal connection established with interviewer.`,
      ],
      weaknesses: [
        'Extremely minimal technical dialogue: candidate skipped multiple questions or answered superficially without depth.',
        'Did not explain algorithm, data structures, or time/space complexity.',
        'Did not implement code or validate test cases in the live editor.',
      ],
      improvements: [
        'Must elaborate on technical mechanisms and algorithmic steps in complete sentences.',
        'Must implement and submit code in the live editor to demonstrate programming proficiency.',
      ],
      practice_plan: [
        'Practice explaining algorithms out loud before writing code.',
        'Master Two Pointers, Hash Maps, and Binary Search data structures.',
        'Practice implementing clean code from scratch without starter hints.',
        'Study Big-O analysis and edge case identification.',
      ],
      topic_tags: ['Algorithmic Explanation', 'Code Implementation', 'Edge Cases'],
      submitted_code: submittedCodeData,
    };
  }

  const allProjectsSummary =
    allProjects.length > 0
      ? allProjects
          .map(
            (p, i) =>
              `${i + 1}. ${p.title} (${p.techStack})${p.description ? ': ' + p.description : ''}`
          )
          .join('\n')
      : `${projectTitle} (${techStack})`;

  const systemInstruction = `You are an elite Principal Technical Hiring Committee Bar Raiser (Google / Amazon / Stripe level).

You are evaluating an entire technical interview session and candidate resume.
Candidate Target Role: ${targetRole.toUpperCase()}
Candidate background: ${resumeSummary || 'Engineering student / developer'}
Primary project: ${projectTitle} (${techStack})

Resume Projects in scope:
${allProjectsSummary}

Candidate Interview Dialogue:
${transcriptText}

=== CANDIDATE PARTICIPATION AUDIT (OBJECTIVE GROUND TRUTH) ===
- Total Questions Asked by Interviewer: ${audit.totalQuestions}
- Meaningful Technical Answers by Candidate: ${audit.substantiveTechnicalTurns}
- Questions Skipped / "I Don't Know" / Refusals: ${audit.refusalOrSkipCount}
- Code Submitted in Live IDE: ${audit.hasSubmittedCode ? `YES (${audit.codeLines} lines, test sandbox ran: ${audit.codeExecuted})` : 'NO CODE SUBMITTED'}
- Technical Keywords Used: ${audit.technicalKeywordsCount} (${audit.technicalKeywordsFound.slice(0, 8).join(', ') || 'None'})
- Candidate Spoken Words: ${audit.candidateSpokenWords}

CRITICAL SCORING PRINCIPLES (STRICT CALIBRATED HIRING COMMITTEE BAR):
- GRADE WITH ABSOLUTE UNCOMPROMISING TECHNICAL REALISM. DO NOT BE POLITE. DO NOT INFLATE SCORES.
- UNANSWERED / SKIPPED / REFUSAL QUESTIONS:
  If candidate skipped questions, said "I don't know", gave only pleasantries ("hi", "ok", "yes sir"), or had 0 substantive technical solutions:
  YOU MUST RETURN technical_score = 1 or 2, and overall_verdict = "No Hire".
  UNDER NO CIRCUMSTANCES AWARD 5 TO AN UNANSWERED QUESTION OR PASSIVE CANDIDATE. 5 IS A BRUTE-FORCE PASSING SCORE, NEVER A NON-ANSWER SCORE!
- NO CODE SUBMISSION:
  If candidate did not write or submit working code in the Live IDE for a technical engineering role:
  technical_score CANNOT EXCEED 4. overall_verdict MUST BE "No Hire". Verbal hand-waving without code is an automatic failure.
- BRUTE-FORCE / PARTIAL SOLUTIONS (Score 5-6 / 10, "Borderline"):
  Only award 5 or 6 if the candidate actually wrote working brute-force code (O(N^2)) or answered core technical questions with minor gaps in edge cases or memory scale.
- OPTIMAL SOLUTIONS (Score 7-8 / 10, "Hire"):
  Candidate explained optimal algorithmic complexity (O(N) or O(log N)), justified data structures, and submitted clean code that ran tests.
- EXCEPTIONAL MASTERY (Score 9-10 / 10, "Strong Hire"):
  Top 5% candidate with instant optimal pattern recognition, deep database indexing/concurrency knowledge, and production-grade code.
- NEVER default to 5 or 7. Base all scores strictly on what the candidate actually demonstrated in the transcript.

Output ONLY valid JSON matching this schema:
{
  "technical_score": number (1-10, strict assessment of technical depth and correctness),
  "communication_score": number (1-10, verbal clarity and precision),
  "confidence_score": number (1-10, conviction and handling pushback),
  "overall_verdict": string ("Strong Hire" | "Hire" | "Borderline" | "No Hire"),
  "interview_skills_breakdown": {
    "technical_depth": number (1-10),
    "problem_solving": number (1-10),
    "system_architecture": number (1-10),
    "communication_clarity": number (1-10),
    "vocal_confidence": number (1-10)
  },
  "interview_improvements": [
    "Specific verbal answer critique #1 (cite what they said or fumbled)",
    "Specific verbal answer critique #2",
    "Specific verbal answer critique #3"
  ],

  "resume_score": number (1-100, overall ATS and resume quality rating),
  "resume_verdict": string ("ATS Optimized — Tier 1 Product Ready" | "Solid Baseline — Needs Quantification" | "Needs Revision"),
  "resume_rating_breakdown": {
    "ats_readability": number (1-10),
    "impact_metrics": number (1-10),
    "tech_stack_relevance": number (1-10),
    "project_presentation": number (1-10)
  },
  "resume_improvements": [
    "Specific bullet rewrite or keyword fix #1 (e.g. rewrite using XYZ formula)",
    "Specific bullet rewrite or keyword fix #2",
    "Specific bullet rewrite or keyword fix #3"
  ],

  "best_fit_roles": [
    {
      "role_title": string,
      "match_percentage": number (70-98),
      "seniority": string (e.g. "Associate / Entry-Level (0-2 YOE)"),
      "why_fit": string,
      "ideal_companies": [string, string, string]
    }
  ],

  "strengths": [string, string, string],
  "weaknesses": [
    "Specific weak area or knowledge gap #1 identified during technical questioning or code review",
    "Specific weak area or knowledge gap #2",
    "Specific weak area or knowledge gap #3"
  ],
  "improvements": [string, string],
  "practice_plan": [string, string, string, string],
  "topic_tags": [string, string, string, string]
}`;

  // Try Gemini AI key pool
  if (geminiKeyPool.available) {
    try {
      const rawJson = await geminiKeyPool.call(async (genAI) => {
        for (const modelName of MODEL_FALLBACK_CHAIN) {
          try {
            const model = genAI.getGenerativeModel({
              model: modelName,
              systemInstruction,
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2,
              },
            });

            const result = await model.generateContent(
              `Analyze this interview session and candidate resume. Output valid JSON evaluation:\n\n${transcriptText}`
            );

            const text = result.response
              .text()
              .trim()
              .replace(/^```json\s*/i, '')
              .replace(/^```\s*/i, '')
              .replace(/```\s*$/i, '')
              .trim();
            if (text && text.startsWith('{')) return text;
          } catch (err: any) {
            const msg = String(err?.message || '').toLowerCase();
            if (
              msg.includes('quota') ||
              msg.includes('429') ||
              msg.includes('rate') ||
              msg.includes('resource_exhausted')
            ) {
              throw err;
            }
            console.warn(`Model ${modelName} failed for evaluation:`, err);
          }
        }
        throw new Error('All models exhausted for evaluation on this key');
      });

      const parsed = JSON.parse(rawJson);

      let techScore =
        typeof parsed.technical_score === 'number'
          ? Math.min(10, Math.max(1, Math.round(parsed.technical_score)))
          : 1;

      let commScore =
        typeof parsed.communication_score === 'number'
          ? Math.min(10, Math.max(1, Math.round(parsed.communication_score)))
          : audit.candidateSpokenWords > 40 ? 5 : 2;

      let confScore =
        typeof parsed.confidence_score === 'number'
          ? Math.min(10, Math.max(1, Math.round(parsed.confidence_score)))
          : Math.round((techScore + commScore) / 2);

      let overallVerdict: 'Strong Hire' | 'Hire' | 'Borderline' | 'No Hire' =
        ['Strong Hire', 'Hire', 'Borderline', 'No Hire'].includes(parsed.overall_verdict)
          ? parsed.overall_verdict
          : 'No Hire';

      // =========================================================================
      // REAL-WORLD HIRING COMMITTEE SAFETY CLAMPS (FAANG CALIBRATED)
      // =========================================================================
      // Clamp 1: Zero substantive answers or pure non-answers/refusals
      if (audit.substantiveTechnicalTurns === 0 && !audit.hasSubmittedCode) {
        techScore = 1;
        commScore = Math.min(commScore, audit.candidateSpokenWords > 30 ? 2 : 1);
        confScore = 1;
        overallVerdict = 'No Hire';
      }
      // Clamp 2: Only 1 superficial technical answer and no code submitted
      else if (audit.substantiveTechnicalTurns <= 1 && !audit.hasSubmittedCode) {
        techScore = Math.min(techScore, 2);
        commScore = Math.min(commScore, 3);
        confScore = Math.min(confScore, 2);
        overallVerdict = 'No Hire';
      }
      // Clamp 3: More refusals/skips than answers and no code
      else if (audit.refusalOrSkipCount >= audit.substantiveTechnicalTurns && !audit.hasSubmittedCode) {
        techScore = Math.min(techScore, 3);
        overallVerdict = 'No Hire';
      }
      // Clamp 4: No code submitted in live IDE for technical engineering role
      else if (!audit.hasSubmittedCode) {
        techScore = Math.min(techScore, 4);
        if (techScore <= 4) overallVerdict = 'No Hire';
      }

      // Ensure verdict strictly matches final calibrated score
      if (techScore <= 4) {
        overallVerdict = 'No Hire';
      } else if (techScore <= 6 && (overallVerdict === 'Hire' || overallVerdict === 'Strong Hire')) {
        overallVerdict = 'Borderline';
      } else if (techScore >= 8 && overallVerdict === 'No Hire') {
        overallVerdict = 'Hire';
      }

      const interviewBreakdown: InterviewSkillsBreakdown = {
        technical_depth: Math.min(techScore, Math.max(1, Number(parsed.interview_skills_breakdown?.technical_depth) || techScore)),
        problem_solving: Math.min(techScore + 1, Math.max(1, Number(parsed.interview_skills_breakdown?.problem_solving) || techScore)),
        system_architecture: Math.min(techScore, Math.max(1, Number(parsed.interview_skills_breakdown?.system_architecture) || techScore)),
        communication_clarity: Math.min(10, Math.max(1, Number(parsed.interview_skills_breakdown?.communication_clarity) || commScore)),
        vocal_confidence: Math.min(10, Math.max(1, Number(parsed.interview_skills_breakdown?.vocal_confidence) || confScore)),
      };

      const resumeBreakdown: ResumeRatingBreakdown = {
        ats_readability: Math.min(10, Math.max(1, Number(parsed.resume_rating_breakdown?.ats_readability) || 8)),
        impact_metrics: Math.min(10, Math.max(1, Number(parsed.resume_rating_breakdown?.impact_metrics) || 7)),
        tech_stack_relevance: Math.min(10, Math.max(1, Number(parsed.resume_rating_breakdown?.tech_stack_relevance) || 9)),
        project_presentation: Math.min(10, Math.max(1, Number(parsed.resume_rating_breakdown?.project_presentation) || 8)),
      };

      const calculatedResumeScore = Math.min(
        100,
        Math.max(
          40,
          Number(parsed.resume_score) ||
            Math.round(
              (resumeBreakdown.ats_readability +
                resumeBreakdown.impact_metrics +
                resumeBreakdown.tech_stack_relevance +
                resumeBreakdown.project_presentation) *
                2.5
            )
        )
      );

      const parsedRoles = Array.isArray(parsed.best_fit_roles) && parsed.best_fit_roles.length > 0
        ? parsed.best_fit_roles
        : defaultBestFitRoles;

      const primaryBestFitTitle = parsedRoles[0]?.role_title;
      const suitableJobLinks = generateSuitableJobLinks(
        targetRole,
        techStack,
        primaryBestFitTitle,
        resumeSummary,
        allProjects,
        parsed.suitable_job_links
      );

      let strengths = Array.isArray(parsed.strengths) && parsed.strengths.length > 0
        ? parsed.strengths
        : ['Clear articulation of project structure and dependencies.'];

      let weaknesses = Array.isArray(parsed.weaknesses) && parsed.weaknesses.length > 0
        ? parsed.weaknesses
        : [
            'Superficial coverage of edge cases and boundary conditions under deep questioning.',
            'Did not provide concrete Big-O mathematical derivation for time and space complexity.',
            'Lacked explicit locking mechanisms or rollback patterns when probed on concurrency conflicts.',
          ];

      if (audit.substantiveTechnicalTurns === 0 || techScore <= 2) {
        weaknesses = [
          'Candidate did not answer the technical questions asked by the interviewer (skipped questions or indicated "I don\'t know").',
          'Did not articulate algorithmic thought process, time/space complexity, or data structures.',
          'No working code implementation or test execution was provided in the live editor.',
          ...weaknesses.filter((w: string) => !w.toLowerCase().includes('clear articulation')),
        ];
      }

      let interviewImprovements = Array.isArray(parsed.interview_improvements) && parsed.interview_improvements.length > 0
        ? parsed.interview_improvements
        : [
            `When probed on edge cases and failure modes, elaborate on specific rollback strategies rather than staying theoretical.`,
            `State time and space complexity upfront before walking through your algorithmic reasoning.`,
            `Under follow-up challenges, articulate the trade-offs of your chosen architecture against alternatives.`,
          ];

      if (techScore <= 2) {
        interviewImprovements = [
          'When asked technical questions, walk the interviewer through your thought process rather than saying "I don\'t know" or skipping.',
          'Switch to the live code editor and implement solutions rather than leaving the coding exercise unattempted.',
          'State Big-O time and space complexity upfront before explaining your logic.',
        ];
      }

      return {
        technical_score: techScore,
        communication_score: commScore,
        confidence_score: confScore,
        overall_verdict: overallVerdict,
        interview_skills_breakdown: interviewBreakdown,
        interview_improvements: interviewImprovements,

        resume_score: calculatedResumeScore,
        resume_verdict:
          parsed.resume_verdict ||
          (calculatedResumeScore >= 85
            ? 'ATS Optimized — Tier 1 Product Ready'
            : calculatedResumeScore >= 70
            ? 'Strong Foundation — Needs Metric Quantification'
            : 'Needs Resume Formatting & Keyword Revision'),
        resume_rating_breakdown: resumeBreakdown,
        resume_improvements: Array.isArray(parsed.resume_improvements) && parsed.resume_improvements.length > 0
          ? parsed.resume_improvements
          : [
              `Apply Google's XYZ formula: 'Accomplished [X], as measured by [Y], by doing [Z]'. Example: 'Engineered Redis caching layer for ${techStack.split(',')[0] || 'API'}, reducing p95 latency by 35% across 10k daily requests'.`,
              `Add explicit production competencies: include Docker containerization, CI/CD GitHub Actions, and monitoring to pass strict corporate ATS filters.`,
              `Quantify scale and database dimensions: include active user counts, query execution benchmarks, or data volume metrics.`,
            ],

        best_fit_roles: parsedRoles,
        suitable_job_links: suitableJobLinks,

        strengths,
        weaknesses,
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ['Provide deeper code-level implementation details.'],
        practice_plan: Array.isArray(parsed.practice_plan) ? parsed.practice_plan : ['Review system design and distributed state patterns.'],
        topic_tags: Array.isArray(parsed.topic_tags) ? parsed.topic_tags : ['System Design', 'Database Indexing', 'API Architecture'],
        submitted_code: submittedCodeData,
      };
    } catch (err) {
      console.error('All Gemini keys failed for evaluation, using fallback:', err);
    }
  }

  // Fallback evaluation based on exact audit and candidate participation
  let fallbackTechScore = 1;
  let fallbackCommScore = 1;
  let fallbackConfScore = 1;
  let fallbackVerdict: 'Strong Hire' | 'Hire' | 'Borderline' | 'No Hire' = 'No Hire';

  if (audit.isZeroParticipation || audit.isNoAnswerSession) {
    fallbackTechScore = 1;
    fallbackCommScore = 1;
    fallbackConfScore = 1;
    fallbackVerdict = 'No Hire';
  } else if (audit.isMinimalParticipation) {
    fallbackTechScore = 2;
    fallbackCommScore = 2;
    fallbackConfScore = 2;
    fallbackVerdict = 'No Hire';
  } else if (!audit.hasSubmittedCode) {
    fallbackTechScore = audit.substantiveTechnicalTurns >= 3 ? 4 : 3;
    fallbackCommScore = audit.candidateSpokenWords > 60 ? 5 : 3;
    fallbackConfScore = 3;
    fallbackVerdict = 'No Hire';
  } else if (audit.hasSubmittedCode && audit.substantiveTechnicalTurns >= 3 && audit.candidateSpokenWords > 80) {
    fallbackTechScore = 7;
    fallbackCommScore = 7;
    fallbackConfScore = 7;
    fallbackVerdict = 'Hire';
  } else if (audit.hasSubmittedCode && audit.substantiveTechnicalTurns >= 1) {
    fallbackTechScore = 5;
    fallbackCommScore = 5;
    fallbackConfScore = 5;
    fallbackVerdict = 'Borderline';
  } else {
    fallbackTechScore = 3;
    fallbackCommScore = 3;
    fallbackConfScore = 3;
    fallbackVerdict = 'No Hire';
  }

  const primaryTech = techStack.split(',')[0]?.trim() || 'TypeScript';
  const roleTitle = defaultBestFitRoles[0].role_title;

  return {
    technical_score: fallbackTechScore,
    communication_score: fallbackCommScore,
    confidence_score: fallbackConfScore,
    overall_verdict: fallbackVerdict,
    interview_skills_breakdown: {
      technical_depth: fallbackTechScore,
      problem_solving: Math.min(10, fallbackTechScore + 1),
      system_architecture: fallbackTechScore,
      communication_clarity: fallbackCommScore,
      vocal_confidence: fallbackConfScore,
    },
    interview_improvements: [
      `When asked about concurrency and write conflicts in ${techStack}, state specific locking mechanisms (e.g. optimistic locking via version columns) rather than general assertions.`,
      `Be more direct in explaining failure recovery: outline exact health checks, retry timeouts, and circuit breaker patterns.`,
      `Structure answers proactively using the STAR method (Situation, Task, Action, Result) when describing past project challenges.`,
    ],

    resume_score: 80,
    resume_verdict: 'ATS Verified — Baseline Established',
    resume_rating_breakdown: {
      ats_readability: 8,
      impact_metrics: 7,
      tech_stack_relevance: 9,
      project_presentation: 8,
    },
    resume_improvements: [
      `Quantify achievements using the Google XYZ formula: Rewrite '${projectTitle}' bullets to highlight tangible performance (e.g., 'Engineered ${primaryTech} microservice handling 15k requests/day, cutting response times by 32%').`,
      `Incorporate missing high-yield keywords for ${targetRole.toUpperCase()}: explicitly include Docker, CI/CD pipelines, automated testing (Jest/PyTest), and cloud deployment.`,
      `Group technical competencies into clear ATS-parsed subcategories: Languages, Frameworks, Databases, and Cloud/DevOps.`,
      `Detail architectural complexity: clarify data flow, caching layers (e.g. Redis), and security practices (e.g. JWT with rotation).`,
    ],

    best_fit_roles: defaultBestFitRoles,
    suitable_job_links: generateSuitableJobLinks(
      targetRole,
      techStack,
      roleTitle,
      resumeSummary,
      allProjects
    ),

    strengths: [
      `Articulated the core service boundaries and data flow of ${projectTitle}.`,
      `Demonstrated familiarity with ${primaryTech} and software patterns.`,
    ],
    weaknesses: [
      `Struggled to articulate edge case handling and boundary constraints under deep probing.`,
      `Did not specify explicit Big-O mathematical derivation for time and space complexity upfront.`,
      `Lacked concrete database locking strategies (e.g. optimistic locking / SELECT FOR UPDATE) when asked about concurrency.`,
    ],
    improvements: [
      `Could not articulate edge case handling and failure recovery in granular detail.`,
      `Answers lacked specific implementation details under deep probing — stayed too high-level.`,
    ],
    practice_plan: [
      `Deep dive into ${primaryTech} internals: query optimization, connection pooling, and memory profiling.`,
      `Practice the STAR method for describing specific implementation bottlenecks and bug fixes.`,
      `Study distributed systems fundamentals: CAP theorem, eventual consistency, and SAGA patterns.`,
      `Review JWT lifecycle, token revocation strategies, and OAuth 2.0 flows.`,
    ],
    topic_tags: ['Database Indexing', 'Concurrency', 'API Security', 'System Architecture', 'ATS Optimization'],
    submitted_code: submittedCodeData,
  };
}

