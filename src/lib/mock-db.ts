import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Student,
  Interview,
  FeedbackReport,
  DepartmentMetrics,
  ChatMessage,
  User,
  SubscriptionPayment,
  ResumeRatingBreakdown,
  InterviewSkillsBreakdown,
  BestFitRole,
  SuitableJobLink,
  JobNewsItem,
  CompanyProfile,
  LiveJobPosting,
} from './types';
import { INITIAL_JOB_NEWS, INITIAL_COMPANIES, INITIAL_LIVE_JOBS } from './jobs-seed';
import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase';

const BUNDLED_DB_PATH = path.join(process.cwd(), 'data', 'ace_interview_db.json');
const TMP_DB_PATH = path.join('/tmp', 'ace_interview_db.json');
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

function getEffectiveDbPath(): string {
  if (!isServerless) return BUNDLED_DB_PATH;
  try {
    if (!fs.existsSync(TMP_DB_PATH) && fs.existsSync(BUNDLED_DB_PATH)) {
      const dir = path.dirname(TMP_DB_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(BUNDLED_DB_PATH, TMP_DB_PATH);
    }
    return TMP_DB_PATH;
  } catch (err) {
    return BUNDLED_DB_PATH;
  }
}

function ensureDataDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// In-memory persistent storage with automatic disk backing
const studentsStore: Map<string, Student> = new Map();
const interviewsStore: Map<string, Interview> = new Map();
const feedbackStore: Map<string, FeedbackReport> = new Map();
const usersStore: Map<string, User> = new Map();
const sessionsStore: Map<string, { userId: string; expiresAt: number }> = new Map();
const paymentsStore: Map<string, SubscriptionPayment> = new Map();
const otpStore: Map<string, { otp: string; expiresAt: number; purpose: string }> = new Map();
const jobNewsStore: Map<string, JobNewsItem> = new Map();
const companiesStore: Map<string, CompanyProfile> = new Map();
const liveJobsStore: Map<string, LiveJobPosting> = new Map();

export const ADMIN_EMAILS = [
  'vamshicodes29@gmail.com',
];

export function isSuperAdminEmail(email?: string): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return ADMIN_EMAILS.some((adm) => adm.toLowerCase() === normalized);
}

// ─── Tamper-Proof Cryptographic Session Token System ───
const SESSION_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'ace-interview-jwt-secret-key-2026-unbreakable';

export function createSessionToken(userId: string, email: string, role: string): string {
  const expiresAt = Date.now() + 30 * 86400000; // 30 days
  const payload = JSON.stringify({ userId, email: email.toLowerCase().trim(), role, expiresAt });
  const b64 = Buffer.from(payload).toString('base64url');
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(b64).digest('base64url');
  return `vantage_token_${b64}.${hmac}`;
}

export function verifySessionToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    if (!token || !token.startsWith('vantage_token_')) return null;
    const body = token.slice('vantage_token_'.length);
    const dotIndex = body.indexOf('.');
    if (dotIndex === -1) return null;
    const b64 = body.slice(0, dotIndex);
    const sig = body.slice(dotIndex + 1);

    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(b64).digest('base64url');
    if (sig !== expected) return null;

    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
    if (payload.expiresAt && payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function ensureSuperAdminExists() {
  const vamshi = Array.from(usersStore.values()).find((u) => u.email.toLowerCase() === 'vamshicodes29@gmail.com');
  if (vamshi) {
    vamshi.role = 'admin';
    vamshi.can_access_dashboard = true;
    vamshi.subscription_status = 'active';
  } else {
    usersStore.set('admin-vamshicodes29-super-admin', {
      id: 'admin-vamshicodes29-super-admin',
      name: 'Vamshi (Admin)',
      email: 'vamshicodes29@gmail.com',
      password: 'vamshicodes@123',
      role: 'admin',
      subscription_status: 'active',
      subscription_expires_at: new Date(Date.now() + 3650 * 86400000).toISOString(),
      interviews_conducted_count: 0,
      can_access_dashboard: true,
      created_at: '2026-09-12T07:31:07.893Z',
    });
  }
}

function serializeDb() {
  return {
    students: Array.from(studentsStore.entries()),
    interviews: Array.from(interviewsStore.entries()),
    feedback: Array.from(feedbackStore.entries()),
    users: Array.from(usersStore.entries()),
    sessions: Array.from(sessionsStore.entries()),
    payments: Array.from(paymentsStore.entries()),
    jobNews: Array.from(jobNewsStore.entries()),
    companies: Array.from(companiesStore.entries()),
    liveJobs: Array.from(liveJobsStore.entries()),
    savedAt: new Date().toISOString(),
  };
}

function hydrateStoresFromParsed(parsed: any) {
  if (parsed.students && Array.isArray(parsed.students)) {
    for (const [k, v] of parsed.students) studentsStore.set(k, v);
  }
  if (parsed.interviews && Array.isArray(parsed.interviews)) {
    for (const [k, v] of parsed.interviews) interviewsStore.set(k, v);
  }
  if (parsed.feedback && Array.isArray(parsed.feedback)) {
    for (const [k, v] of parsed.feedback) feedbackStore.set(k, v);
  }
  if (parsed.users && Array.isArray(parsed.users)) {
    for (const [k, v] of parsed.users) usersStore.set(k, v);
  }
  if (parsed.sessions && Array.isArray(parsed.sessions)) {
    for (const [k, v] of parsed.sessions) sessionsStore.set(k, v);
  }
  if (parsed.payments && Array.isArray(parsed.payments)) {
    for (const [k, v] of parsed.payments) paymentsStore.set(k, v);
  }
  if (parsed.jobNews && Array.isArray(parsed.jobNews)) {
    for (const [k, v] of parsed.jobNews) jobNewsStore.set(k, v);
  }
  if (parsed.companies && Array.isArray(parsed.companies)) {
    for (const [k, v] of parsed.companies) companiesStore.set(k, v);
  }
  if (parsed.liveJobs && Array.isArray(parsed.liveJobs)) {
    for (const [k, v] of parsed.liveJobs) liveJobsStore.set(k, v);
  }
}

/**
 * Upload the database snapshot to Supabase Cloud Storage (ace_db_sync bucket).
 * Merges any new remote records before uploading so concurrent lambdas never overwrite each other.
 */
export async function syncToCloud(): Promise<void> {
  if (!isSupabaseConfigured() || !supabaseAdmin) return;
  try {
    // 1. Download current cloud snapshot and merge to avoid wiping out concurrent entries
    try {
      const { data } = await supabaseAdmin.storage
        .from('ace_db_sync')
        .download('ace_interview_db.json');
      if (data) {
        const text = await data.text();
        const remote = JSON.parse(text);
        if (remote.users && Array.isArray(remote.users)) {
          for (const [k, v] of remote.users) {
            if (!usersStore.has(k)) {
              usersStore.set(k, v);
            }
          }
        }
        if (remote.sessions && Array.isArray(remote.sessions)) {
          for (const [k, v] of remote.sessions) {
            if (!sessionsStore.has(k)) {
              sessionsStore.set(k, v);
            }
          }
        }
        if (remote.interviews && Array.isArray(remote.interviews)) {
          for (const [k, v] of remote.interviews) {
            if (!interviewsStore.has(k)) {
              interviewsStore.set(k, v);
            }
          }
        }
        if (remote.feedback && Array.isArray(remote.feedback)) {
          for (const [k, v] of remote.feedback) {
            if (!feedbackStore.has(k)) {
              feedbackStore.set(k, v);
            }
          }
        }
      }
    } catch (_) {}

    // Always guarantee Super Admin vamshicodes29@gmail.com is present
    ensureSuperAdminExists();

    const payload = serializeDb();
    const { error: uploadError } = await supabaseAdmin.storage
      .from('ace_db_sync')
      .upload('ace_interview_db.json', JSON.stringify(payload, null, 2), {
        upsert: true,
        contentType: 'application/json',
      });
    if (uploadError) {
      console.error('[Cloud Sync] Upload error to Supabase storage:', uploadError);
    } else {
      console.log(`[Cloud Sync] Upload success (${usersStore.size} users, ${interviewsStore.size} interviews)`);
    }
  } catch (err) {
    console.warn('[Cloud Sync] Upload error (non-fatal):', err);
  }
}

let lastCloudSyncTime = 0;
let isSyncingFromCloud = false;

/**
 * Pull the latest database snapshot from Supabase Cloud Storage.
 * Cached for 2.5s so multiple fast API calls don't re-fetch unnecessarily.
 */
export async function syncFromCloud(force: boolean = false): Promise<boolean> {
  const now = Date.now();
  if (!force && (now - lastCloudSyncTime < 2500 || isSyncingFromCloud)) {
    return false;
  }
  if (!isSupabaseConfigured() || !supabaseAdmin) return false;

  isSyncingFromCloud = true;
  try {
    const downloadPromise = supabaseAdmin.storage
      .from('ace_db_sync')
      .download('ace_interview_db.json');
    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('Cloud sync timeout') }), 5000)
    );

    const { data, error } = (await Promise.race([downloadPromise, timeoutPromise])) as any;
    if (error || !data) {
      return false;
    }

    const text = await data.text();
    const parsed = JSON.parse(text);
    hydrateStoresFromParsed(parsed);
    ensureSuperAdminExists();
    lastCloudSyncTime = Date.now();
    return true;
  } catch (err) {
    console.warn('[Cloud Sync] Download error (fallback to local):', err);
    return false;
  } finally {
    isSyncingFromCloud = false;
  }
}

let saveTimer: NodeJS.Timeout | null = null;
function persistDbToDisk(sync: boolean = false) {
  const doWrite = () => {
    try {
      const targetPath = getEffectiveDbPath();
      ensureDataDir(targetPath);
      const payload = serializeDb();
      fs.writeFileSync(targetPath, JSON.stringify(payload, null, 2), 'utf8');

      // Also trigger cloud storage synchronization
      syncToCloud().catch((e) => console.warn('[Cloud Sync Background Error]:', e));
    } catch (err) {
      console.warn('[DB Persistence] Failed to write db to disk:', err);
    }
  };

  if (sync) {
    doWrite();
  } else {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(doWrite, 50);
  }
}

function loadDbFromDisk(): boolean {
  try {
    const targetPath = getEffectiveDbPath();
    if (!fs.existsSync(targetPath)) {
      if (isServerless && fs.existsSync(BUNDLED_DB_PATH)) {
        try {
          ensureDataDir(TMP_DB_PATH);
          fs.copyFileSync(BUNDLED_DB_PATH, TMP_DB_PATH);
        } catch (_) {}
      } else {
        return false;
      }
    }
    const readPath = fs.existsSync(targetPath) ? targetPath : BUNDLED_DB_PATH;
    if (!fs.existsSync(readPath)) return false;
    const raw = fs.readFileSync(readPath, 'utf8');
    const parsed = JSON.parse(raw);
    hydrateStoresFromParsed(parsed);
    ensureSuperAdminExists();
    return true;
  } catch (err) {
    console.warn('[DB Persistence] Failed to load db from disk:', err);
    return false;
  }
}

// Initialize realistic seed data
let isInitialized = false;
const initSeedData = () => {
  if (isInitialized) return;
  isInitialized = true;

  loadDbFromDisk();
  ensureSuperAdminExists();

  // Seed Job & Hiring Intelligence modules if empty
  if (jobNewsStore.size === 0) {
    INITIAL_JOB_NEWS.forEach((n) => jobNewsStore.set(n.id, n));
  }
  if (companiesStore.size === 0) {
    INITIAL_COMPANIES.forEach((c) => companiesStore.set(c.id, c));
  }
  if (liveJobsStore.size === 0) {
    INITIAL_LIVE_JOBS.forEach((j) => liveJobsStore.set(j.id, j));
  }
  // IMPORTANT: Do NOT call persistDbToDisk(true) or syncToCloud() here!
  // This prevents cold serverless lambdas from overwriting cloud storage upon initial import.
};

export async function resetAllUserData() {
  studentsStore.clear();
  interviewsStore.clear();
  feedbackStore.clear();
  usersStore.clear();
  sessionsStore.clear();
  paymentsStore.clear();

  // Root Super Administrator: vamshicodes29@gmail.com
  ensureSuperAdminExists();

  // Re-seed jobs and companies if empty
  if (jobNewsStore.size === 0) {
    INITIAL_JOB_NEWS.forEach((n) => jobNewsStore.set(n.id, n));
  }
  if (companiesStore.size === 0) {
    INITIAL_COMPANIES.forEach((c) => companiesStore.set(c.id, c));
  }
  if (liveJobsStore.size === 0) {
    INITIAL_LIVE_JOBS.forEach((j) => liveJobsStore.set(j.id, j));
  }

  persistDbToDisk(true);
  await syncToCloud();
  console.log('[DB Reset] Successfully purged all user data. vamshicodes29@gmail.com is initialized as root admin.');
}

// Student operations
export async function createStudent(name: string, branch: string): Promise<Student> {
  const newStudent: Student = {
    id: crypto.randomUUID(),
    name,
    branch,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert({
          id: newStudent.id,
          name: newStudent.name,
          branch: newStudent.branch,
        })
        .select()
        .single();
      if (!error && data) return data as Student;
    } catch (e) {
      console.warn('Supabase insert failed, using fallback store:', e);
    }
  }

  studentsStore.set(newStudent.id, newStudent);
  persistDbToDisk();
  return newStudent;
}

export async function getStudent(id: string): Promise<Student | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data } = await supabase.from('students').select('*').eq('id', id).single();
      if (data) return data as Student;
    } catch (e) {
      console.warn('Supabase query failed, checking fallback store:', e);
    }
  }
  return studentsStore.get(id) || null;
}

// Interview operations
export async function createInterview(
  student_id: string,
  project_title: string,
  tech_stack: string,
  project_description?: string,
  resume_summary?: string,
  resume_filename?: string,
  interviewer_persona?: 'alex' | 'sophia',
  all_projects?: string,
  target_role?: string,
  user_id?: string
): Promise<Interview> {
  const newInterview: Interview = {
    id: crypto.randomUUID(),
    student_id,
    user_id,
    project_title,
    tech_stack,
    project_description,
    resume_summary,
    resume_filename,
    interviewer_persona: interviewer_persona || 'alex',
    all_projects,
    target_role: target_role as any,
    transcript: [],
    duration_seconds: 0,
    status: 'in-progress',
    created_at: new Date().toISOString(),
  };

  interviewsStore.set(newInterview.id, newInterview);
  persistDbToDisk(true);
  await syncToCloud();
  return newInterview;
}

export async function getInterview(id: string): Promise<Interview | null> {
  let interview = interviewsStore.get(id);
  if (!interview) {
    await syncFromCloud();
    interview = interviewsStore.get(id);
  }
  if (!interview) {
    loadDbFromDisk();
    interview = interviewsStore.get(id);
  }
  if (!interview) return null;

  const student = studentsStore.get(interview.student_id);
  return { ...interview, student };
}

export async function updateInterview(
  id: string,
  updates: Partial<Pick<Interview, 'transcript' | 'duration_seconds' | 'status'>>
): Promise<Interview | null> {
  let current = interviewsStore.get(id);
  if (!current) {
    await syncFromCloud();
    current = interviewsStore.get(id);
  }
  if (!current) return null;

  const updated: Interview = {
    ...current,
    ...updates,
  };
  interviewsStore.set(id, updated);
  persistDbToDisk(true);
  await syncToCloud();
  return updated;
}

// Feedback Report operations
export async function createFeedbackReport(data: {
  interview_id: string;
  technical_score: number;
  communication_score: number;
  confidence_score?: number;
  overall_verdict?: string;
  interview_skills_breakdown?: InterviewSkillsBreakdown;
  interview_improvements?: string[];
  resume_score?: number;
  resume_verdict?: string;
  resume_rating_breakdown?: ResumeRatingBreakdown;
  resume_improvements?: string[];
  best_fit_roles?: BestFitRole[];
  suitable_job_links?: SuitableJobLink[];
  strengths: string[];
  weaknesses?: string[];
  submitted_code?: { code: string; language: string; output?: string };
  improvements: string[];
  practice_plan: string[];
  topic_tags: string[];
}): Promise<FeedbackReport> {
  const newReport: FeedbackReport = {
    id: crypto.randomUUID(),
    confidence_score: data.confidence_score || 6,
    overall_verdict: data.overall_verdict || 'Borderline',
    ...data,
    created_at: new Date().toISOString(),
  };

  feedbackStore.set(data.interview_id, newReport);
  persistDbToDisk(true);
  await syncToCloud();
  return newReport;
}

export async function getFeedbackReport(interview_id: string): Promise<FeedbackReport | null> {
  initSeedData();

  let report = feedbackStore.get(interview_id);
  if (!report) {
    await syncFromCloud();
    report = feedbackStore.get(interview_id);
  }
  if (!report) {
    loadDbFromDisk();
    report = feedbackStore.get(interview_id);
  }
  if (!report) return null;

  const interview = await getInterview(interview_id);
  return { ...report, interview: interview || undefined };
}

// Placement Department Metrics
export async function getDepartmentMetrics(): Promise<DepartmentMetrics> {
  initSeedData();
  await syncFromCloud();

  // Aggregate from store using all registered candidates & admins
  const allUsers = Array.from(usersStore.values());
  const allReports = Array.from(feedbackStore.values());
  const allInterviews = Array.from(interviewsStore.values());

  const totalInvited = allUsers.length;
  // Users who conducted an interview OR have an interview record
  const usersWithInterviews = new Set(allInterviews.map((i) => i.user_id).filter(Boolean));
  const activeStudents = allUsers.filter(
    (u) => u.interviews_conducted_count > 0 || (u.id && usersWithInterviews.has(u.id))
  ).length;

  const completedThreeOrMore = allUsers.filter((u) => u.interviews_conducted_count >= 2).length;
  const totalInterviews = allInterviews.length;

  const avgTech =
    allReports.length > 0
      ? Number((allReports.reduce((acc, r) => acc + r.technical_score, 0) / allReports.length).toFixed(1))
      : 8.2;

  const avgComm =
    allReports.length > 0
      ? Number((allReports.reduce((acc, r) => acc + r.communication_score, 0) / allReports.length).toFixed(1))
      : 8.0;

  // Calculate weak topics frequency
  const topicCounts: Record<string, { count: number; totalScore: number }> = {};
  allReports.forEach((r) => {
    (r.topic_tags || []).forEach((tag) => {
      if (!topicCounts[tag]) {
        topicCounts[tag] = { count: 0, totalScore: 0 };
      }
      topicCounts[tag].count += 1;
      topicCounts[tag].totalScore += r.technical_score;
    });
  });

  const weakTopics = Object.entries(topicCounts)
    .map(([topic, stat]) => ({
      topic,
      count: stat.count,
      avgScore: Number((stat.totalScore / stat.count).toFixed(1)),
      percentageStruggled: Math.round((stat.count / Math.max(allReports.length, 1)) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Recent student sessions linked to ALL interviews conducted (Candidates & Admins)
  const recentSessions = allInterviews
    .map((interview) => {
      const report = feedbackStore.get(interview.id);
      const student = interview.student_id ? studentsStore.get(interview.student_id) : null;
      const user = interview.user_id ? usersStore.get(interview.user_id) : null;
      const isSuperAdmin = user ? isSuperAdminEmail(user.email) : false;

      const studentName = (user?.name || student?.name || 'Candidate') + (isSuperAdmin ? ' (Super Admin)' : '');

      return {
        interviewId: interview.id,
        studentName,
        candidateEmail: user?.email || undefined,
        userId: user?.id,
        branch: student?.branch || 'Computer Science & Engineering',
        projectTitle: interview.project_title || 'Technical Assessment',
        targetRole: interview.target_role || 'sde',
        technicalScore: report ? report.technical_score : (interview.status === 'completed' ? 7 : 0),
        communicationScore: report ? report.communication_score : (interview.status === 'completed' ? 7 : 0),
        primaryGapArea: report?.topic_tags?.[0] || (interview.status === 'in-progress' ? 'Session In-Progress' : 'Evaluation Completed'),
        completedAt: report?.created_at || interview.created_at,
        status: interview.status || (report ? 'completed' : 'in-progress'),
      };
    })
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  return {
    totalInvited,
    activeStudents: Math.max(activeStudents, allInterviews.length > 0 ? 1 : 0),
    completedThreeOrMore,
    totalInterviews,
    averageTechnicalScore: avgTech,
    averageCommunicationScore: avgComm,
    weakTopics: weakTopics.length > 0 ? weakTopics : [
      { topic: 'System Design', count: 3, avgScore: 6.5, percentageStruggled: 50 },
      { topic: 'Data Structures & Algorithms', count: 2, avgScore: 7.0, percentageStruggled: 40 },
    ],
    recentSessions,
  };
}

export interface CandidateInterviewHistoryItem {
  interviewId: string;
  createdAt: string;
  targetRole: string;
  persona: 'alex' | 'sophia';
  projectTitle: string;
  status: string;
  technicalScore: number;
  communicationScore: number;
  overallScore: number;
  verdict: string;
  strengths: string[];
  improvements: string[];
}

export async function getUserInterviewHistory(
  userId?: string,
  email?: string,
  name?: string
): Promise<CandidateInterviewHistoryItem[]> {
  initSeedData();
  await syncFromCloud();

  const matchingStudentIds = new Set<string>();
  if (userId) matchingStudentIds.add(userId);

  for (const s of studentsStore.values()) {
    if (
      (userId && s.id === userId) ||
      (name && s.name?.toLowerCase().trim() === name.toLowerCase().trim())
    ) {
      matchingStudentIds.add(s.id);
    }
  }

  const results: CandidateInterviewHistoryItem[] = [];

  for (const inv of interviewsStore.values()) {
    const matchesUser =
      (userId && inv.user_id === userId) ||
      (inv.student_id && matchingStudentIds.has(inv.student_id));

    if (matchesUser) {
      const report = feedbackStore.get(inv.id);
      const tech = report?.technical_score ?? 0;
      const comm = report?.communication_score ?? 0;
      const overall = tech && comm ? Math.round(((tech + comm) / 2) * 10) / 10 : (tech || comm || 0);

      results.push({
        interviewId: inv.id,
        createdAt: inv.created_at,
        targetRole: inv.target_role || 'sde',
        persona: inv.interviewer_persona || 'alex',
        projectTitle: inv.project_title || 'General Engineering Assessment',
        status: inv.status,
        technicalScore: tech,
        communicationScore: comm,
        overallScore: overall,
        verdict: report?.overall_verdict || (inv.status === 'completed' ? 'Completed' : 'In Progress'),
        strengths: report?.strengths || [],
        improvements: report?.improvements || [],
      });
    }
  }

  return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}


// ─────────────────────────────────────────────────────────────────────────────
// User Authentication, Subscriptions & Permissions
// ─────────────────────────────────────────────────────────────────────────────

export async function createUser(
  name: string,
  email: string,
  password?: string,
  role: 'user' | 'admin' | 'college_admin' = 'user'
): Promise<User> {
  initSeedData();
  const normalizedEmail = email.toLowerCase().trim();

  // Always pull latest cloud state before checking duplication or inserting
  await syncFromCloud(true);

  for (const u of usersStore.values()) {
    if (u.email.toLowerCase() === normalizedEmail) {
      if (password) {
        u.password = password;
        persistDbToDisk(true);
        await syncToCloud();
      }
      return sanitizeUser(u);
    }
  }

  const isSuperAdmin = isSuperAdminEmail(normalizedEmail);

  const newUser: User = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    password: password || 'default123',
    role: isSuperAdmin ? 'admin' : role,
    subscription_status: isSuperAdmin ? 'active' : 'free_trial',
    subscription_expires_at: isSuperAdmin ? new Date(Date.now() + 365 * 86400000).toISOString() : undefined,
    interviews_conducted_count: 0,
    can_access_dashboard: isSuperAdmin,
    created_at: new Date().toISOString(),
  };

  usersStore.set(newUser.id, newUser);
  persistDbToDisk(true);
  await syncToCloud();
  console.log(`[AUTH] Successfully registered new user: ${normalizedEmail} (Total users: ${usersStore.size})`);
  return sanitizeUser(newUser);
}

export async function authenticateUser(
  email: string,
  password?: string
): Promise<{ user: User; token: string } | null> {
  initSeedData();
  const normalizedEmail = email.toLowerCase().trim();

  await syncFromCloud(true);
  let targetUser = Array.from(usersStore.values()).find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!targetUser) {
    return null;
  }

  if (password && targetUser.password && targetUser.password !== password) {
    return null;
  }

  // Elevate super admin if matches admin list
  if (isSuperAdminEmail(normalizedEmail)) {
    targetUser.role = 'admin';
    targetUser.can_access_dashboard = true;
    targetUser.subscription_status = 'active';
    targetUser.subscription_expires_at = new Date(Date.now() + 3650 * 86400000).toISOString();
  }

  // Generate self-verifying, cryptographically signed token
  const token = createSessionToken(targetUser.id, targetUser.email, targetUser.role);
  sessionsStore.set(token, {
    userId: targetUser.id,
    expiresAt: Date.now() + 30 * 86400000,
  });
  persistDbToDisk(true);
  await syncToCloud();
  return { user: sanitizeUser(targetUser), token };
}

// ─── OTP Verification System ────────────────────────────────────────────────
export function createOtpSignature(email: string, otp: string, expiresAt: number): string {
  const payload = `${email.toLowerCase().trim()}:${otp.trim()}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${payload}:${hmac}`;
}

export function verifyOtpSignature(email: string, code: string, signatureToken?: string): boolean {
  try {
    if (!signatureToken) return false;
    const parts = signatureToken.split(':');
    if (parts.length !== 4) return false;
    const [sigEmail, sigOtp, sigExpiresAt, sigHmac] = parts;
    if (sigEmail.toLowerCase().trim() !== email.toLowerCase().trim()) return false;
    if (sigOtp.trim() !== code.trim()) return false;
    if (Date.now() > Number(sigExpiresAt)) return false;
    const payload = `${sigEmail}:${sigOtp}:${sigExpiresAt}`;
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
    return sigHmac === expected;
  } catch {
    return false;
  }
}

export async function generateAndSaveOtp(
  email: string,
  purpose: 'login' | 'signup' = 'login'
): Promise<{ otp: string; signatureToken: string; expiresAt: number }> {
  initSeedData();
  const normalizedEmail = email.toLowerCase().trim();
  // Generate random 6-digit numeric code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

  otpStore.set(normalizedEmail, { otp, expiresAt, purpose });
  const signatureToken = createOtpSignature(normalizedEmail, otp, expiresAt);
  console.log(`[AUTH OTP] Generated 6-digit code for ${normalizedEmail} (${purpose}): ${otp}`);
  return { otp, signatureToken, expiresAt };
}

export async function verifyOtpCode(
  email: string,
  code: string,
  signatureToken?: string
): Promise<{ valid: boolean; reason?: string }> {
  initSeedData();
  const normalizedEmail = email.toLowerCase().trim();
  const trimmedCode = (code || '').trim();

  // 1. Check stateless cryptographic signature first (reliable across multiple serverless lambdas)
  if (signatureToken && verifyOtpSignature(normalizedEmail, trimmedCode, signatureToken)) {
    otpStore.delete(normalizedEmail);
    return { valid: true };
  }

  // 2. Fallback to in-memory store
  const entry = otpStore.get(normalizedEmail);
  if (!entry) {
    return { valid: false, reason: 'No OTP requested for this email or it has expired. Please tap resend.' };
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalizedEmail);
    return { valid: false, reason: 'This verification code has expired. Please request a new code.' };
  }

  if (entry.otp !== trimmedCode) {
    return { valid: false, reason: 'Invalid verification code. Please check your OTP and try again.' };
  }

  // Code verified successfully, clear from store
  otpStore.delete(normalizedEmail);
  return { valid: true };
}

export async function getUserByToken(token: string): Promise<User | null> {
  initSeedData();

  // 1. Verify signed token cryptographically
  const verified = verifySessionToken(token);
  let userId = verified?.userId;
  let userEmail = verified?.email;

  // 2. Fallback to sessionsStore if older token
  if (!userId) {
    let session = sessionsStore.get(token);
    if (!session) {
      await syncFromCloud(true);
      session = sessionsStore.get(token);
    }
    if (session && session.expiresAt >= Date.now()) {
      userId = session.userId;
    }
  }

  if (!userId && !userEmail) return null;

  // 3. Find user in memory
  let user = userId ? usersStore.get(userId) : null;
  if (!user && userEmail) {
    user = Array.from(usersStore.values()).find((u) => u.email.toLowerCase() === userEmail.toLowerCase());
  }

  // 4. If not found in current memory, sync from cloud
  if (!user) {
    await syncFromCloud(true);
    user = userId ? usersStore.get(userId) : null;
    if (!user && userEmail) {
      user = Array.from(usersStore.values()).find((u) => u.email.toLowerCase() === userEmail.toLowerCase());
    }
  }

  // 5. Guarantee super admin privileges
  if (user && isSuperAdminEmail(user.email)) {
    user.role = 'admin';
    user.can_access_dashboard = true;
    user.subscription_status = 'active';
  } else if (!user && userEmail && isSuperAdminEmail(userEmail)) {
    ensureSuperAdminExists();
    user = usersStore.get('admin-vamshicodes29-super-admin') || null;
  }

  // 6. Resilient Serverless Fallback: If user not yet loaded into this lambda container but token is cryptographically verified
  if (!user && verified) {
    const isSuperAdmin = isSuperAdminEmail(verified.email);
    const restoredUser: User = {
      id: verified.userId || `user-${Date.now()}`,
      name: verified.email.split('@')[0],
      email: verified.email,
      role: isSuperAdmin ? 'admin' : ((verified.role as any) || 'user'),
      subscription_status: isSuperAdmin ? 'active' : 'free_trial',
      can_access_dashboard: isSuperAdmin,
      interviews_conducted_count: 0,
      created_at: new Date().toISOString(),
    };
    usersStore.set(restoredUser.id, restoredUser);
    return sanitizeUser(restoredUser);
  }

  return user ? sanitizeUser(user) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  initSeedData();
  let user = usersStore.get(id);
  if (!user) {
    await syncFromCloud(true);
    user = usersStore.get(id);
  }
  if (user && isSuperAdminEmail(user.email)) {
    user.role = 'admin';
    user.can_access_dashboard = true;
    user.subscription_status = 'active';
  }
  return user ? sanitizeUser(user) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  initSeedData();
  const normalizedEmail = email.toLowerCase().trim();
  let user = Array.from(usersStore.values()).find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    await syncFromCloud(true);
    user = Array.from(usersStore.values()).find((u) => u.email.toLowerCase() === normalizedEmail);
  }
  if (user) {
    if (isSuperAdminEmail(user.email)) {
      user.role = 'admin';
      user.can_access_dashboard = true;
      user.subscription_status = 'active';
    }
    return sanitizeUser(user);
  }
  return null;
}

export async function updateUserPassword(email: string, newPassword: string): Promise<User | null> {
  initSeedData();
  const normalizedEmail = email.toLowerCase().trim();
  let user = Array.from(usersStore.values()).find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    await syncFromCloud(true);
    user = Array.from(usersStore.values()).find((u) => u.email.toLowerCase() === normalizedEmail);
  }
  if (user) {
    user.password = newPassword;
    persistDbToDisk(true);
    await syncToCloud();
    console.log(`[DB Auth] Successfully updated password for ${normalizedEmail}`);
    return sanitizeUser(user);
  }
  return null;
}

export async function getAllUsers(): Promise<User[]> {
  initSeedData();
  await syncFromCloud(true);
  return Array.from(usersStore.values()).map(sanitizeUser);
}

/**
 * Super Admin user inspection: returns complete user list with role, access flags,
 * and plain_password so the platform owner (vamshicodes29@gmail.com) can manage accounts.
 */
export async function getAllUsersForAdmin(): Promise<User[]> {
  initSeedData();
  await syncFromCloud(true);
  return Array.from(usersStore.values()).map((u) => {
    if (isSuperAdminEmail(u.email)) {
      u.role = 'admin';
      u.can_access_dashboard = true;
      u.subscription_status = 'active';
    }
    return {
      ...u,
      plain_password: u.password || '••••••••',
    };
  });
}

export async function promoteUserRole(
  userId: string,
  role: 'user' | 'college_admin' | 'admin',
  canAccessDashboard: boolean
): Promise<User | null> {
  initSeedData();
  const user = usersStore.get(userId);
  if (!user) return null;

  user.role = role;
  user.can_access_dashboard = canAccessDashboard;
  usersStore.set(userId, user);
  persistDbToDisk(true);
  await syncToCloud();
  return sanitizeUser(user);
}

/**
 * Record direct UPI payment (Scan QR / UPI ID)
 */
export async function recordUpiPayment(
  userId: string,
  utrNumber: string,
  amount: number = 99,
  upiId: string = 'Official PhonePe QR'
): Promise<{ success: boolean; payment: SubscriptionPayment; user: User }> {
  initSeedData();
  const user = usersStore.get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const payment: SubscriptionPayment = {
    id: `upi_pmt_${crypto.randomUUID().slice(0, 8)}`,
    user_id: userId,
    user_name: user.name,
    user_email: user.email,
    amount,
    currency: 'INR',
    payment_method: `UPI QR Scan - UTR: ${utrNumber}`,
    status: 'pending',
    transaction_id: utrNumber,
    created_at: new Date().toISOString(),
  };

  paymentsStore.set(payment.id, payment);

  // Activate 30-day Pro subscription immediately
  const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
  user.subscription_status = 'active';
  user.subscription_expires_at = expiresAt;
  usersStore.set(userId, user);

  await syncToCloud();
  persistDbToDisk(true);
  return { success: true, payment, user: sanitizeUser(user) };
}

export async function getAllPayments(): Promise<SubscriptionPayment[]> {
  initSeedData();
  await syncFromCloud(true);
  const list = Array.from(paymentsStore.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return list.map((p) => {
    const user = usersStore.get(p.user_id);
    return {
      ...p,
      user_name: p.user_name || user?.name || 'Unknown User',
      user_email: p.user_email || user?.email || 'unknown@domain.com',
    };
  });
}

export async function updatePaymentStatus(
  paymentId: string,
  status: 'verified' | 'rejected' | 'completed'
): Promise<SubscriptionPayment | null> {
  initSeedData();
  await syncFromCloud(true);
  const payment = paymentsStore.get(paymentId);
  if (!payment) return null;

  payment.status = status;
  payment.verified_at = new Date().toISOString();
  paymentsStore.set(paymentId, payment);

  const user = usersStore.get(payment.user_id);
  if (user) {
    if (status === 'verified' || status === 'completed') {
      const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
      user.subscription_status = 'active';
      user.subscription_expires_at = expiresAt;
    } else if (status === 'rejected') {
      user.subscription_status = 'expired';
    }
    usersStore.set(user.id, user);
  }

  await syncToCloud();
  persistDbToDisk(true);
  return payment;
}

export async function updateUser(
  id: string,
  updates: Partial<User>
): Promise<User | null> {
  initSeedData();
  const user = usersStore.get(id);
  if (!user) return null;

  const updated: User = { ...user, ...updates };
  usersStore.set(id, updated);
  persistDbToDisk();
  return sanitizeUser(updated);
}

export async function checkUserInterviewAccess(
  userId?: string
): Promise<{ allowed: boolean; reason?: 'AUTH_REQUIRED' | 'PAYWALL_REQUIRED'; user?: User }> {
  initSeedData();
  if (!userId) {
    return { allowed: false, reason: 'AUTH_REQUIRED' };
  }

  const user = usersStore.get(userId);
  if (!user) {
    return { allowed: false, reason: 'AUTH_REQUIRED' };
  }

  // Admins always have unlimited access
  if (user.role === 'admin') {
    return { allowed: true, user: sanitizeUser(user) };
  }

  // If subscription is active and not expired
  if (user.subscription_status === 'active') {
    if (user.subscription_expires_at) {
      const expires = new Date(user.subscription_expires_at).getTime();
      if (expires > Date.now()) {
        return { allowed: true, user: sanitizeUser(user) };
      } else {
        user.subscription_status = 'expired';
        usersStore.set(user.id, user);
      }
    } else {
      return { allowed: true, user: sanitizeUser(user) };
    }
  }

  // 1-time free trial check:
  // If user hasn't taken their 1 free interview yet, allow it!
  if (user.interviews_conducted_count < 1) {
    return { allowed: true, user: sanitizeUser(user) };
  }

  // Free trial is exhausted! Paywall required
  return { allowed: false, reason: 'PAYWALL_REQUIRED', user: sanitizeUser(user) };
}

export async function incrementUserInterviewCount(userId?: string): Promise<void> {
  if (!userId) return;
  initSeedData();
  const user = usersStore.get(userId);
  if (user) {
    user.interviews_conducted_count += 1;
    usersStore.set(userId, user);
    persistDbToDisk();
  }
}

export async function processSubscriptionPayment(
  userId: string,
  amount: number = 99,
  paymentMethod: string = 'UPI'
): Promise<{ payment: SubscriptionPayment; user: User }> {
  initSeedData();
  const user = usersStore.get(userId);
  if (!user) throw new Error('User not found.');

  const txId = `vantage_tx_${crypto.randomUUID().slice(0, 8)}`;
  const payment: SubscriptionPayment = {
    id: crypto.randomUUID(),
    user_id: userId,
    amount,
    currency: 'INR',
    payment_method: paymentMethod,
    status: 'completed',
    transaction_id: txId,
    created_at: new Date().toISOString(),
  };

  paymentsStore.set(payment.id, payment);

  // Activate 30-day Pro subscription
  const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
  user.subscription_status = 'active';
  user.subscription_expires_at = expiresAt;
  usersStore.set(userId, user);
  persistDbToDisk();

  return { payment, user: sanitizeUser(user) };
}

function sanitizeUser(u: User): User {
  const { password, ...safeUser } = u;
  return safeUser as User;
}

// ── JOB MODULE CRUD & QUERY HELPERS ──

export async function getJobNews(filters?: {
  track?: string;
  experienceLevel?: string;
  tag?: string;
}): Promise<JobNewsItem[]> {
  initSeedData();
  await syncFromCloud();
  let items = Array.from(jobNewsStore.values());
  if (filters?.track && filters.track !== 'all') {
    items = items.filter((n) => n.track === 'all' || n.track === filters.track);
  }
  if (filters?.experienceLevel && filters.experienceLevel !== 'all') {
    items = items.filter((n) => n.experienceLevel === 'all' || n.experienceLevel === filters.experienceLevel);
  }
  if (filters?.tag && filters.tag !== 'all') {
    items = items.filter((n) => n.tag === filters.tag);
  }
  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getCompanies(filters?: {
  sector?: string;
  size?: string;
  hiringStatus?: string;
  freshersWelcome?: boolean;
  search?: string;
}): Promise<CompanyProfile[]> {
  initSeedData();
  await syncFromCloud();
  let items = Array.from(companiesStore.values());
  if (filters?.sector && filters.sector !== 'all') {
    items = items.filter((c) => c.sector.toLowerCase().includes(filters.sector!.toLowerCase()));
  }
  if (filters?.size && filters.size !== 'all') {
    items = items.filter((c) => c.size === filters.size);
  }
  if (filters?.hiringStatus && filters.hiringStatus !== 'all') {
    items = items.filter((c) => c.hiringStatus === filters.hiringStatus);
  }
  if (filters?.freshersWelcome !== undefined) {
    items = items.filter((c) => c.freshersWelcome === filters.freshersWelcome);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q)
    );
  }
  return items;
}

export async function getLiveJobs(filters?: {
  track?: string;
  experienceLevel?: string;
  platform?: string;
  isNewThisWeek?: boolean;
  search?: string;
}): Promise<LiveJobPosting[]> {
  initSeedData();
  await syncFromCloud();
  let items = Array.from(liveJobsStore.values());
  if (filters?.track && filters.track !== 'all') {
    items = items.filter((j) => j.targetTrack === filters.track);
  }
  if (filters?.experienceLevel && filters.experienceLevel !== 'all') {
    items = items.filter((j) => j.experienceLevel.toLowerCase().includes(filters.experienceLevel!.toLowerCase()));
  }
  if (filters?.platform && filters.platform !== 'all') {
    items = items.filter((j) => j.platform.toLowerCase() === filters.platform!.toLowerCase());
  }
  if (filters?.isNewThisWeek !== undefined) {
    items = items.filter((j) => j.isNewThisWeek === filters.isNewThisWeek);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (j) =>
        j.roleTitle.toLowerCase().includes(q) ||
        j.companyName.toLowerCase().includes(q) ||
        j.tags.some((t) => t.toLowerCase().includes(q)) ||
        j.location.toLowerCase().includes(q)
    );
  }
  return items.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
}

export async function createJobNewsItem(item: Omit<JobNewsItem, 'id'>): Promise<JobNewsItem> {
  initSeedData();
  const id = `news-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newItem: JobNewsItem = { ...item, id };
  jobNewsStore.set(id, newItem);
  persistDbToDisk();
  syncToCloud();
  return newItem;
}

export async function deleteJobNewsItem(id: string): Promise<boolean> {
  initSeedData();
  const existed = jobNewsStore.delete(id);
  if (existed) {
    persistDbToDisk();
    syncToCloud();
  }
  return existed;
}

export async function createCompanyProfile(item: Omit<CompanyProfile, 'id'>): Promise<CompanyProfile> {
  initSeedData();
  const id = `comp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newComp: CompanyProfile = { ...item, id };
  companiesStore.set(id, newComp);
  persistDbToDisk();
  syncToCloud();
  return newComp;
}

export async function updateCompanyProfile(id: string, updates: Partial<CompanyProfile>): Promise<CompanyProfile | null> {
  initSeedData();
  const comp = companiesStore.get(id);
  if (!comp) return null;
  const updated = { ...comp, ...updates };
  companiesStore.set(id, updated);
  persistDbToDisk();
  syncToCloud();
  return updated;
}

export async function createLiveJobPosting(item: Omit<LiveJobPosting, 'id'>): Promise<LiveJobPosting> {
  initSeedData();
  const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newJob: LiveJobPosting = { ...item, id };
  liveJobsStore.set(id, newJob);
  persistDbToDisk();
  syncToCloud();
  return newJob;
}

export async function deleteLiveJobPosting(id: string): Promise<boolean> {
  initSeedData();
  const existed = liveJobsStore.delete(id);
  if (existed) {
    persistDbToDisk();
    syncToCloud();
  }
  return existed;
}


