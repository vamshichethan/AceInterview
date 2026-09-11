import fs from 'fs';
import path from 'path';
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
} from './types';
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

export const ADMIN_EMAILS = [
  'vamshicodes29@gmail.com',
  'admin@aceinterview.ai',
  'admin@vantage.ai',
];

export function isSuperAdminEmail(email?: string): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return ADMIN_EMAILS.some((adm) => adm.toLowerCase() === normalized);
}

let saveTimer: NodeJS.Timeout | null = null;
function persistDbToDisk(sync: boolean = false) {
  const doWrite = () => {
    try {
      const targetPath = getEffectiveDbPath();
      ensureDataDir(targetPath);
      const payload = {
        students: Array.from(studentsStore.entries()),
        interviews: Array.from(interviewsStore.entries()),
        feedback: Array.from(feedbackStore.entries()),
        users: Array.from(usersStore.entries()),
        sessions: Array.from(sessionsStore.entries()),
        payments: Array.from(paymentsStore.entries()),
        savedAt: new Date().toISOString(),
      };
      fs.writeFileSync(targetPath, JSON.stringify(payload, null, 2), 'utf8');
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
    if (parsed.students) {
      studentsStore.clear();
      for (const [k, v] of parsed.students) studentsStore.set(k, v);
    }
    if (parsed.interviews) {
      interviewsStore.clear();
      for (const [k, v] of parsed.interviews) interviewsStore.set(k, v);
    }
    if (parsed.feedback) {
      feedbackStore.clear();
      for (const [k, v] of parsed.feedback) feedbackStore.set(k, v);
    }
    if (parsed.users) {
      usersStore.clear();
      for (const [k, v] of parsed.users) usersStore.set(k, v);
    }
    if (parsed.sessions) {
      sessionsStore.clear();
      for (const [k, v] of parsed.sessions) sessionsStore.set(k, v);
    }
    if (parsed.payments) {
      paymentsStore.clear();
      for (const [k, v] of parsed.payments) paymentsStore.set(k, v);
    }
    console.log(`[DB Persistence] Successfully hydrated database: ${usersStore.size} users, ${interviewsStore.size} interviews.`);
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

  const loaded = loadDbFromDisk();

  // Always ensure vamshicodes29@gmail.com has super-admin rights
  const vamshiCodes = Array.from(usersStore.values()).find((u) => u.email.toLowerCase() === 'vamshicodes29@gmail.com');
  if (vamshiCodes) {
    vamshiCodes.role = 'admin';
    vamshiCodes.can_access_dashboard = true;
    vamshiCodes.subscription_status = 'active';
    vamshiCodes.subscription_expires_at = new Date(Date.now() + 3650 * 86400000).toISOString();
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
      created_at: new Date().toISOString(),
    });
  }

  if (loaded && usersStore.size > 1) return;

  if (usersStore.size <= 1) {
    // Seed Platform Administrator
    usersStore.set('admin-0000-0000-0000-000000000001', {
      id: 'admin-0000-0000-0000-000000000001',
      name: 'Platform Administrator',
      email: 'admin@aceinterview.ai',
      password: 'admin123',
      role: 'admin',
      subscription_status: 'active',
      subscription_expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
      interviews_conducted_count: 0,
      can_access_dashboard: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    });

    // Seed Demo Candidate (Rahul Verma)
    usersStore.set('user-0000-0000-0000-000000000001', {
      id: 'user-0000-0000-0000-000000000001',
      name: 'Rahul Verma',
      email: 'candidate@aceinterview.ai',
      password: 'demo123',
      role: 'user',
      subscription_status: 'free_trial',
      interviews_conducted_count: 1, // Already completed 1 free trial interview
      can_access_dashboard: false,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    });

    // Seed Priya Patel (Pro Member)
    usersStore.set('user-0000-0000-0000-000000000002', {
      id: 'user-0000-0000-0000-000000000002',
      name: 'Priya Patel',
      email: 'priya.patel@aceinterview.ai',
      password: 'demo123',
      role: 'user',
      subscription_status: 'active',
      subscription_expires_at: new Date(Date.now() + 25 * 86400000).toISOString(),
      interviews_conducted_count: 2,
      can_access_dashboard: false,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    });

    // Seed Rohan Verma (Free Trial)
    usersStore.set('user-0000-0000-0000-000000000003', {
      id: 'user-0000-0000-0000-000000000003',
      name: 'Rohan Verma',
      email: 'rohan.verma@aceinterview.ai',
      password: 'demo123',
      role: 'user',
      subscription_status: 'free_trial',
      interviews_conducted_count: 1,
      can_access_dashboard: false,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    });

    // Seed Ananya Gupta (Pro Member)
    usersStore.set('user-0000-0000-0000-000000000004', {
      id: 'user-0000-0000-0000-000000000004',
      name: 'Ananya Gupta',
      email: 'ananya.gupta@aceinterview.ai',
      password: 'demo123',
      role: 'user',
      subscription_status: 'active',
      subscription_expires_at: new Date(Date.now() + 20 * 86400000).toISOString(),
      interviews_conducted_count: 2,
      can_access_dashboard: false,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    });

    // Seed Karthik Rao (Free Trial)
    usersStore.set('user-0000-0000-0000-000000000005', {
      id: 'user-0000-0000-0000-000000000005',
      name: 'Karthik Rao',
      email: 'karthik.rao@aceinterview.ai',
      password: 'demo123',
      role: 'user',
      subscription_status: 'free_trial',
      interviews_conducted_count: 1,
      can_access_dashboard: false,
      created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    });
  }

  if (studentsStore.size > 0) return;

  const initialStudents: Student[] = [
    {
      id: 'user-0000-0000-0000-000000000001',
      name: 'Rahul Verma',
      branch: 'Computer Science & Engineering',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'user-0000-0000-0000-000000000002',
      name: 'Priya Patel',
      branch: 'Information Technology',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'user-0000-0000-0000-000000000003',
      name: 'Rohan Verma',
      branch: 'Computer Science & Engineering',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'user-0000-0000-0000-000000000004',
      name: 'Ananya Gupta',
      branch: 'Data Science & AI',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'user-0000-0000-0000-000000000005',
      name: 'Karthik Rao',
      branch: 'Electronics & Communication',
      created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
  ];

  initialStudents.forEach((s) => studentsStore.set(s.id, s));

  const initialInterviews: Interview[] = [
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      student_id: 'user-0000-0000-0000-000000000001',
      user_id: 'user-0000-0000-0000-000000000001',
      target_role: 'sde',
      project_title: 'Distributed E-Commerce Microservices',
      tech_stack: 'React, Node.js, PostgreSQL, Redis, Docker',
      project_description: 'A microservices architecture handling order placement, inventory reservations, and payment processing with high concurrency.',
      duration_seconds: 540,
      status: 'completed',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      transcript: [
        { sender: 'ai', text: 'Welcome Rahul. Could you walk me through the high-level architecture of your distributed e-commerce system and how services communicate?' },
        { sender: 'user', text: 'We used an API gateway with separate auth, inventory, and order services communicating via gRPC and Redis Pub/Sub for notifications.' },
        { sender: 'ai', text: 'Interesting. How do you handle distributed transaction failures between the order service and the payment processor?' },
        { sender: 'user', text: 'We implemented a basic try-catch rollback in the backend service.' },
        { sender: 'ai', text: 'In a microservices setup, a local try-catch cannot rollback remote database commits. Did you look into the Saga pattern or 2-Phase Commit?' },
      ],
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      student_id: 'user-0000-0000-0000-000000000002',
      user_id: 'user-0000-0000-0000-000000000002',
      target_role: 'backend',
      project_title: 'Real-Time Healthcare Patient Telemetry',
      tech_stack: 'Next.js, FastAPI, PostgreSQL, WebSockets',
      project_description: 'Streaming vital patient metrics from IoT ward devices to doctor dashboards with sub-second latency.',
      duration_seconds: 610,
      status: 'completed',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      transcript: [
        { sender: 'ai', text: 'Welcome Priya. What made you choose WebSockets over Server-Sent Events for streaming patient telemetry data?' },
        { sender: 'user', text: 'WebSockets allowed bidirectional heartbeats and alert acknowledgments directly from doctor terminals with lower latency.' },
        { sender: 'ai', text: 'How do you structure your PostgreSQL indexes when queries require filtering the last 10 minutes of heart rates across 500 beds?' },
      ],
    },
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      student_id: 'user-0000-0000-0000-000000000003',
      user_id: 'user-0000-0000-0000-000000000003',
      target_role: 'sde',
      project_title: 'Algorithmic Crypto Arbitrage Engine',
      tech_stack: 'Python, Go, Redis, TimescaleDB',
      project_description: 'Detects cross-exchange price spreads and places low-latency atomic orders.',
      duration_seconds: 480,
      status: 'completed',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      transcript: [],
    },
    {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      student_id: 'user-0000-0000-0000-000000000004',
      user_id: 'user-0000-0000-0000-000000000004',
      target_role: 'ai_ml',
      project_title: 'Campus Placement Automation Portal',
      tech_stack: 'React, Express, MongoDB, AWS S3',
      project_description: 'Manages student resume verification, company interview scheduling, and placement reporting.',
      duration_seconds: 520,
      status: 'completed',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      transcript: [],
    },
    {
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      student_id: 'user-0000-0000-0000-000000000005',
      user_id: 'user-0000-0000-0000-000000000005',
      target_role: 'fullstack',
      project_title: 'Smart Agriculture IoT Crop Monitoring',
      tech_stack: 'Flutter, Node.js, MQTT, InfluxDB',
      project_description: 'Soil moisture, UV, and temperature sensors reporting field health to farmers via edge computing.',
      duration_seconds: 390,
      status: 'completed',
      created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
      transcript: [],
    },
  ];

  initialInterviews.forEach((i) => interviewsStore.set(i.id, i));

  const initialFeedback: FeedbackReport[] = [
    {
      id: 'faaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      interview_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      technical_score: 7,
      communication_score: 8,
      confidence_score: 7,
      overall_verdict: 'Hire',
      strengths: [
        'Clear explanation of microservice boundaries and gRPC contracts',
        'Articulate breakdown of cache invalidation strategy with Redis',
        'Structured problem-solving mindset when explaining system architecture',
      ],
      improvements: [
        'Struggled to articulate Saga pattern vs 2-Phase Commit when asked about distributed rollback',
        'Fumbled when asked how auth JWT tokens are invalidated on immediate logout',
      ],
      practice_plan: [
        'Review JWT token revocation strategies: Redis token blocklisting vs short TTL refresh tokens',
        'Study Saga orchestration vs choreography patterns for distributed transaction management',
        'Prepare a crisp 60-second STAR response describing the hardest bug solved in the order pipeline',
      ],
      topic_tags: ['Distributed Transactions', 'Authentication & JWT', 'Cache Invalidation'],
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'fbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      interview_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      technical_score: 8,
      communication_score: 7,
      confidence_score: 8,
      overall_verdict: 'Strong Hire',
      strengths: [
        'Strong grasp of WebSocket backpressure and connection reconnection strategies',
        'Good reasoning regarding relational integrity in PostgreSQL for patient vitals',
      ],
      improvements: [
        'Could not explain composite B-Tree database indexing when queried on timeseries query latency',
        'Used frequent filler words when describing socket connection drops',
      ],
      practice_plan: [
        'Deep dive into PostgreSQL EXPLAIN ANALYZE and composite index order (bed_id, recorded_at)',
        'Practice concise vocal delivery when answering fallback failure scenarios',
      ],
      topic_tags: ['Database Indexing', 'Concurrency', 'Error Handling'],
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'fccccccc-cccc-cccc-cccc-cccccccccccc',
      interview_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      technical_score: 6,
      communication_score: 6,
      confidence_score: 5,
      overall_verdict: 'Borderline',
      strengths: [
        'Good understanding of order book data structures and Go goroutines',
      ],
      improvements: [
        'Severe gap in thread safety and race conditions under high throughput',
        'Hesitant when asked to calculate memory footprint of in-memory queues',
      ],
      practice_plan: [
        'Study Go sync.Mutex vs atomic operations and race detector',
        'Prepare concrete memory calculation examples for interview questions',
      ],
      topic_tags: ['Concurrency', 'System Design', 'Memory Management'],
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'fddddddd-dddd-dddd-dddd-dddddddddddd',
      interview_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      technical_score: 5,
      communication_score: 7,
      confidence_score: 6,
      overall_verdict: 'Borderline',
      strengths: [
        'Pleasant communication pace and structured walk-through of the student workflow',
      ],
      improvements: [
        'Used textbook answers for MongoDB schema design without justifying why NoSQL was chosen over relational',
        'Could not explain how S3 presigned URLs prevent unauthorized resume access',
      ],
      practice_plan: [
        'Study NoSQL vs SQL trade-offs with concrete access pattern analysis',
        'Implement and explain presigned S3 upload security in a mock repo',
      ],
      topic_tags: ['Database Indexing', 'API Security', 'System Design'],
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'feeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      interview_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      technical_score: 7,
      communication_score: 6,
      confidence_score: 6,
      overall_verdict: 'Hire',
      strengths: [
        'Solid understanding of MQTT broker QoS levels and sensor battery constraints',
      ],
      improvements: [
        'Lacked clarity on time-series database retention policies and aggregation rollups',
        'Stumbled when asked how sensor payloads are sanitized before ingestion',
      ],
      practice_plan: [
        'Review InfluxDB continuous queries and downsampling',
        'Study API input validation and MQTT payload encryption with TLS',
      ],
      topic_tags: ['API Security', 'System Design', 'Time-series Storage'],
      created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
  ];

  initialFeedback.forEach((f) => feedbackStore.set(f.interview_id, f));
  persistDbToDisk(true);
};

initSeedData();

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

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .insert({
          id: newInterview.id,
          student_id,
          project_title,
          tech_stack,
          transcript: [],
          duration_seconds: 0,
          status: 'in-progress',
        })
        .select()
        .single();
      if (!error && data) return data as Interview;
    } catch (e) {
      console.warn('Supabase insert interview failed, using fallback store:', e);
    }
  }

  interviewsStore.set(newInterview.id, newInterview);
  persistDbToDisk();
  return newInterview;
}

export async function getInterview(id: string): Promise<Interview | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data } = await supabase
        .from('interviews')
        .select('*, student:students(*)')
        .eq('id', id)
        .single();
      if (data) return data as Interview;
    } catch (e) {
      console.warn('Supabase query interview failed, checking fallback store:', e);
    }
  }

  const interview = interviewsStore.get(id);
  if (!interview) return null;

  const student = studentsStore.get(interview.student_id);
  return { ...interview, student };
}

export async function updateInterview(
  id: string,
  updates: Partial<Pick<Interview, 'transcript' | 'duration_seconds' | 'status'>>
): Promise<Interview | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data } = await supabase
        .from('interviews')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (data) return data as Interview;
    } catch (e) {
      console.warn('Supabase update failed, updating fallback store:', e);
    }
  }

  const current = interviewsStore.get(id);
  if (!current) return null;

  const updated: Interview = {
    ...current,
    ...updates,
  };
  interviewsStore.set(id, updated);
  persistDbToDisk();
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

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: reportData, error } = await supabase
        .from('feedback_reports')
        .insert(newReport)
        .select()
        .single();
      if (!error && reportData) return reportData as FeedbackReport;
    } catch (e) {
      console.warn('Supabase insert feedback report failed, using fallback:', e);
    }
  }

  feedbackStore.set(data.interview_id, newReport);
  persistDbToDisk(true);
  return newReport;
}

export async function getFeedbackReport(interview_id: string): Promise<FeedbackReport | null> {
  initSeedData();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data } = await supabase
        .from('feedback_reports')
        .select('*, interview:interviews(*, student:students(*))')
        .eq('interview_id', interview_id)
        .single();
      if (data) return data as FeedbackReport;
    } catch (e) {
      console.warn('Supabase get report failed, checking fallback store:', e);
    }
  }

  let report = feedbackStore.get(interview_id);
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

  // Aggregate from store using real registered candidate users
  const candidateUsers = Array.from(usersStore.values()).filter((u) => u.role !== 'admin');
  const allReports = Array.from(feedbackStore.values());
  const allInterviews = Array.from(interviewsStore.values());

  const totalInvited = candidateUsers.length;
  // Candidates who have conducted at least 1 interview
  const activeStudents = candidateUsers.filter((u) => u.interviews_conducted_count > 0).length;

  // Candidates who completed multiple interviews
  const completedThreeOrMore = candidateUsers.filter((u) => u.interviews_conducted_count >= 2).length;

  const totalInterviews = allInterviews.length;

  const avgTech =
    allReports.length > 0
      ? Number((allReports.reduce((acc, r) => acc + r.technical_score, 0) / allReports.length).toFixed(1))
      : 0;

  const avgComm =
    allReports.length > 0
      ? Number((allReports.reduce((acc, r) => acc + r.communication_score, 0) / allReports.length).toFixed(1))
      : 0;

  // Calculate weak topics frequency
  const topicCounts: Record<string, { count: number; totalScore: number }> = {};
  allReports.forEach((r) => {
    r.topic_tags.forEach((tag) => {
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

  // Recent student sessions linked to real registered candidate users
  const recentSessions = allReports
    .map((r) => {
      const interview = interviewsStore.get(r.interview_id);
      const student = interview ? studentsStore.get(interview.student_id) : null;
      const user = interview?.user_id ? usersStore.get(interview.user_id) : null;

      return {
        interviewId: r.interview_id,
        studentName: user?.name || student?.name || 'Anonymous Candidate',
        candidateEmail: user?.email || undefined,
        userId: user?.id,
        branch: student?.branch || 'Computer Science & Engineering',
        projectTitle: interview?.project_title || 'Project Evaluation',
        targetRole: interview?.target_role,
        technicalScore: r.technical_score,
        communicationScore: r.communication_score,
        primaryGapArea: r.topic_tags[0] || 'System Architecture',
        completedAt: r.created_at,
        status: interview?.status || 'completed',
      };
    })
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  return {
    totalInvited,
    activeStudents,
    completedThreeOrMore,
    totalInterviews,
    averageTechnicalScore: avgTech,
    averageCommunicationScore: avgComm,
    weakTopics,
    recentSessions,
  };
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

  for (const u of usersStore.values()) {
    if (u.email.toLowerCase() === normalizedEmail) {
      throw new Error('An account with this email already exists.');
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
    can_access_dashboard: isSuperAdmin || role === 'admin' || role === 'college_admin',
    created_at: new Date().toISOString(),
  };

  usersStore.set(newUser.id, newUser);
  persistDbToDisk(true);
  return sanitizeUser(newUser);
}

export async function authenticateUser(
  email: string,
  password?: string
): Promise<{ user: User; token: string } | null> {
  initSeedData();
  const normalizedEmail = email.toLowerCase().trim();

  for (const u of usersStore.values()) {
    if (u.email.toLowerCase() === normalizedEmail) {
      if (password && u.password && u.password !== password) {
        return null;
      }

      // Elevate super admin if matches admin list
      if (isSuperAdminEmail(normalizedEmail)) {
        u.role = 'admin';
        u.can_access_dashboard = true;
        u.subscription_status = 'active';
        u.subscription_expires_at = new Date(Date.now() + 3650 * 86400000).toISOString();
      }

      const token = `vantage_token_${crypto.randomUUID()}`;
      sessionsStore.set(token, {
        userId: u.id,
        expiresAt: Date.now() + 30 * 86400000,
      });
      persistDbToDisk(true);
      return { user: sanitizeUser(u), token };
    }
  }
  return null;
}

// ─── OTP Verification System ────────────────────────────────────────────────
export async function generateAndSaveOtp(
  email: string,
  purpose: 'login' | 'signup' = 'login'
): Promise<string> {
  initSeedData();
  const normalizedEmail = email.toLowerCase().trim();
  // Generate random 6-digit numeric code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

  otpStore.set(normalizedEmail, { otp, expiresAt, purpose });
  console.log(`[AUTH OTP] Generated 6-digit code for ${normalizedEmail} (${purpose}): ${otp}`);
  return otp;
}

export async function verifyOtpCode(
  email: string,
  code: string
): Promise<{ valid: boolean; reason?: string }> {
  initSeedData();
  const normalizedEmail = email.toLowerCase().trim();
  const trimmedCode = (code || '').trim();

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
  let session = sessionsStore.get(token);
  if (!session) {
    loadDbFromDisk();
    session = sessionsStore.get(token);
  }
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessionsStore.delete(token);
    persistDbToDisk(true);
    return null;
  }
  const user = usersStore.get(session.userId);
  if (user && isSuperAdminEmail(user.email)) {
    user.role = 'admin';
    user.can_access_dashboard = true;
    user.subscription_status = 'active';
  }
  return user ? sanitizeUser(user) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  initSeedData();
  const user = usersStore.get(id);
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
  for (const u of usersStore.values()) {
    if (u.email.toLowerCase() === normalizedEmail) {
      if (isSuperAdminEmail(u.email)) {
        u.role = 'admin';
        u.can_access_dashboard = true;
        u.subscription_status = 'active';
      }
      return sanitizeUser(u);
    }
  }
  return null;
}

export async function updateUserPassword(email: string, newPassword: string): Promise<User | null> {
  initSeedData();
  const normalizedEmail = email.toLowerCase().trim();
  for (const u of usersStore.values()) {
    if (u.email.toLowerCase() === normalizedEmail) {
      u.password = newPassword;
      persistDbToDisk(true);
      console.log(`[DB Auth] Successfully updated password for ${normalizedEmail}`);
      return sanitizeUser(u);
    }
  }
  return null;
}

export async function getAllUsers(): Promise<User[]> {
  initSeedData();
  return Array.from(usersStore.values()).map(sanitizeUser);
}

/**
 * Super Admin user inspection: includes raw password/credentials as stored in DB
 * so the super-admin can manage and verify accounts directly.
 */
export async function getAllUsersForAdmin(): Promise<User[]> {
  initSeedData();
  return Array.from(usersStore.values()).map((u) => {
    if (isSuperAdminEmail(u.email)) {
      u.role = 'admin';
      u.can_access_dashboard = true;
      u.subscription_status = 'active';
    }
    return { ...u };
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
  return sanitizeUser(user);
}

/**
 * Record direct UPI payment (Scan QR / UPI ID)
 */
export async function recordUpiPayment(
  userId: string,
  utrNumber: string,
  amount: number = 99,
  upiId: string = '7975883646@ybl'
): Promise<{ success: boolean; payment: SubscriptionPayment; user: User }> {
  initSeedData();
  const user = usersStore.get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const payment: SubscriptionPayment = {
    id: `upi_pmt_${crypto.randomUUID().slice(0, 8)}`,
    user_id: userId,
    amount,
    currency: 'INR',
    payment_method: `UPI (${upiId}) - UTR: ${utrNumber}`,
    status: 'completed',
    transaction_id: utrNumber,
    created_at: new Date().toISOString(),
  };

  paymentsStore.set(payment.id, payment);

  // Activate 30-day Pro subscription
  const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
  user.subscription_status = 'active';
  user.subscription_expires_at = expiresAt;
  usersStore.set(userId, user);

  persistDbToDisk(true);
  return { success: true, payment, user: sanitizeUser(user) };
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

