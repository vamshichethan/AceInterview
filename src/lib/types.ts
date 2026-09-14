export interface Student {
  id: string;
  name: string;
  branch: string;
  created_at: string;
}

export interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
  timestamp?: string;
}

export type TargetRole =
  | 'sde'
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'ai_ml'
  | 'data_science'
  | 'devops'
  | 'mobile';

export const TARGET_ROLE_LABELS: Record<TargetRole, string> = {
  sde: 'SDE — Software Development Engineer',
  frontend: 'Frontend Engineer',
  backend: 'Backend Engineer',
  fullstack: 'Full Stack Engineer',
  ai_ml: 'AI / ML Engineer',
  data_science: 'Data Scientist',
  devops: 'DevOps / SRE Engineer',
  mobile: 'Mobile Engineer (iOS / Android)',
};

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  plain_password?: string;
  role: 'user' | 'admin' | 'college_admin';
  subscription_status: 'free_trial' | 'active' | 'expired';
  subscription_expires_at?: string;
  interviews_conducted_count: number;
  can_access_dashboard: boolean;
  created_at: string;
}

export interface SubscriptionPayment {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: 'completed' | 'pending' | 'failed' | 'verified' | 'rejected';
  transaction_id: string;
  created_at: string;
  verified_at?: string;
  verified_by?: string;
}

export interface Interview {
  id: string;
  student_id: string;
  user_id?: string;
  project_title: string;
  tech_stack: string;
  project_description?: string;
  resume_summary?: string;
  resume_filename?: string;
  interviewer_persona?: 'alex' | 'sophia';
  all_projects?: string; // JSON-stringified array of {title, techStack, description}
  target_role?: TargetRole;
  transcript: ChatMessage[];
  duration_seconds: number;
  status: 'in-progress' | 'completed';
  created_at: string;
  student?: Student;
}

export interface ResumeRatingBreakdown {
  ats_readability: number; // 1-10
  impact_metrics: number; // 1-10
  tech_stack_relevance: number; // 1-10
  project_presentation: number; // 1-10
}

export interface InterviewSkillsBreakdown {
  technical_depth: number; // 1-10
  problem_solving: number; // 1-10
  system_architecture: number; // 1-10
  communication_clarity: number; // 1-10
  vocal_confidence: number; // 1-10
}

export interface BestFitRole {
  role_title: string;
  match_percentage: number; // 0-100
  seniority: string;
  why_fit: string;
  ideal_companies: string[];
}

export interface SuitableJobLink {
  platform:
    | 'LinkedIn'
    | 'Google Jobs'
    | 'Naukri'
    | 'Foundit'
    | 'Internshala'
    | 'Cutshort'
    | 'Google Careers'
    | 'Indeed'
    | 'Wellfound'
    | 'Y Combinator'
    | 'Glassdoor'
    | string;
  role_title: string;
  apply_url: string;
  badge_text: string;
  match_tag: string;
  description: string;
}

export interface FeedbackReport {
  id: string;
  interview_id: string;
  // Interview Scores
  technical_score: number; // 1-10
  communication_score: number; // 1-10
  confidence_score: number; // 1-10
  overall_verdict: string; // 'Strong Hire' | 'Hire' | 'Borderline' | 'No Hire'
  interview_skills_breakdown?: InterviewSkillsBreakdown;
  interview_improvements?: string[];

  // Resume Scores & Improvements
  resume_score?: number; // 0-100
  resume_verdict?: string; // e.g. 'ATS Optimized — Tier 1 Tech Ready'
  resume_rating_breakdown?: ResumeRatingBreakdown;
  resume_improvements?: string[];

  // Career Fit & Job Opportunities
  best_fit_roles?: BestFitRole[];
  suitable_job_links?: SuitableJobLink[];

  strengths: string[];
  weaknesses?: string[]; // Specific weak areas, gaps, or suboptimal answers
  improvements: string[]; // Actionable recommendations
  practice_plan: string[];
  topic_tags: string[];
  submitted_code?: {
    code: string;
    language: string;
    output?: string;
  };
  created_at: string;
  interview?: Interview;
}

export interface ProjectEntry {
  title: string;
  techStack: string;
  description: string;
}

export interface ParsedResume {
  candidateName: string;
  branch: string;
  projectTitle: string;
  techStack: string;
  projectDescription: string;
  resumeSummary: string;
  suggestedRole?: TargetRole;
  keyHighlights: string[];
  drillDownTopics: string[];
  allProjects: ProjectEntry[];
}

export interface WeakTopicStat {
  topic: string;
  count: number;
  avgScore: number;
  percentageStruggled: number;
}

export interface DepartmentMetrics {
  totalInvited: number;
  activeStudents: number;
  completedThreeOrMore: number;
  totalInterviews: number;
  averageTechnicalScore: number;
  averageCommunicationScore: number;
  weakTopics: WeakTopicStat[];
  recentSessions: {
    interviewId: string;
    studentName: string;
    candidateEmail?: string;
    userId?: string;
    branch: string;
    projectTitle: string;
    targetRole?: TargetRole;
    technicalScore: number;
    communicationScore: number;
    primaryGapArea: string;
    completedAt: string;
    status: string;
  }[];
}

// ── JOB MODULE INTERFACES ──
export interface JobNewsItem {
  id: string;
  headline: string;
  companyName: string;
  companyLogo?: string;
  date: string;
  source: string;
  summary: string;
  tag: 'Hiring' | 'Layoff' | 'Funding' | 'Campus Drive';
  track: TargetRole | 'all';
  experienceLevel: 'freshers' | 'experienced' | 'all';
  linkUrl?: string;
  isNewThisWeek?: boolean;
}

export interface CompanyProfile {
  id: string;
  name: string;
  logo?: string;
  sector: string;
  size: 'Startup' | 'Growth Scaleup' | 'MNC / Enterprise' | 'Unicorn';
  hiringStatus: 'Actively Hiring' | 'Selective Hires' | 'Hiring Freeze';
  freshersWelcome: boolean;
  targetTracks: TargetRole[];
  careersUrl: string;
  location: string;
  description: string;
  openPositionsCount?: number;
}

export interface LiveJobPosting {
  id: string;
  roleTitle: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  experienceLevel: 'Freshers (0-1 YOE)' | 'Associate (1-3 YOE)' | 'Mid-Senior (3+ YOE)';
  targetTrack: TargetRole;
  platform:
    | 'LinkedIn'
    | 'Naukri'
    | 'Indeed'
    | 'Wellfound'
    | 'Internshala'
    | 'Google Careers'
    | 'Y Combinator'
    | 'Cutshort'
    | 'Foundit'
    | 'Adzuna'
    | 'Adzuna Verified'
    | 'Arbeitnow'
    | 'Hacker News YC';
  applyUrl: string;
  postedDate: string;
  isNewThisWeek: boolean;
  tags: string[];
  salaryOrStipend?: string;
  batchOrEligibility?: string;
}


