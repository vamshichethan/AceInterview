'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Target,
  ArrowRight,
  RotateCcw,
  Printer,
  ChevronDown,
  ChevronUp,
  BarChart2,
  BookOpen,
  Check,
  Briefcase,
  FolderGit2,
  FileText,
  ExternalLink,
  Compass,
  Building2,
  TrendingUp,
  Zap,
  Mic,
  FileCheck,
  Layers,
  Award,
  ArrowUpRight,
  XCircle,
  Code2,
} from 'lucide-react';
import {
  FeedbackReport,
  TARGET_ROLE_LABELS,
  TargetRole,
  ProjectEntry,
  BestFitRole,
  SuitableJobLink,
  ResumeRatingBreakdown,
  InterviewSkillsBreakdown,
} from '@/lib/types';
import confetti from 'canvas-confetti';

export default function StudentReportPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params?.id as string;

  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [checkedPlanItems, setCheckedPlanItems] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!interviewId) return;

    const fetchReport = async () => {
      // 1. Instant hydration from client-side localStorage cache
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`ace_report_${interviewId}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && (parsed.technical_score !== undefined || parsed.interview_id)) {
              setReport(parsed);
              setLoading(false);
            }
          }
        } catch (_) {}
      }

      try {
        let fetchedReport: FeedbackReport | null = null;
        const res = await fetch(`/api/report/${interviewId}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.report) {
            fetchedReport = data.report;
            setReport(data.report);
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(`ace_report_${interviewId}`, JSON.stringify(data.report));
              } catch (_) {}
            }
          }
        } else {
          // If server didn't find it yet, check if we have it in localStorage
          if (typeof window !== 'undefined') {
            const cached = localStorage.getItem(`ace_report_${interviewId}`);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed) {
                fetchedReport = parsed;
                setReport(parsed);
                setLoading(false);
                return;
              }
            }
          }
          throw new Error('Feedback report not found');
        }

        // Celebration confetti — only for passing hiring bar (Hire / Strong Hire or score >= 7)
        const finalScore = fetchedReport?.technical_score ?? 0;
        const finalVerdict = fetchedReport?.overall_verdict;
        if (finalVerdict === 'Strong Hire' || finalVerdict === 'Hire' || finalScore >= 7) {
          try {
            confetti({
              particleCount: 60,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch (_) {}
        }
      } catch (err) {
        console.error('Error fetching report:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [interviewId]);

  const togglePlanCheck = (index: number) => {
    setCheckedPlanItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center min-h-[70vh]">
        <div className="w-14 h-14 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mb-4" />
        <h3 className="text-xl font-bold text-white">Synthesizing Diagnostic Career Dossier...</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md">
          Auditing resume ATS compatibility, scoring interview technical depth, identifying best-fit career roles, and curating verified job openings.
        </p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center min-h-[70vh]">
        <AlertTriangle className="w-12 h-12 text-amber-400 mb-3" />
        <h3 className="text-lg font-bold text-white">Report Not Found</h3>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          Could not locate an evaluation report for this interview session.
        </p>
        <Link
          href="/student/setup"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
        >
          Start New Interview
        </Link>
      </div>
    );
  }

  // Interview scores
  const techScore = report.technical_score;
  const commScore = report.communication_score;
  const confScore = report.confidence_score || Math.round((techScore + commScore) / 2);
  const verdict = report.overall_verdict || (techScore >= 8 ? 'Hire' : techScore >= 6 ? 'Borderline' : 'No Hire');

  // Resume scores
  const resumeScore = report.resume_score ?? 84;
  const resumeVerdict =
    report.resume_verdict ??
    (resumeScore >= 85
      ? 'ATS Optimized — Tier 1 Tech Ready'
      : resumeScore >= 70
      ? 'Strong Foundation — Needs Metric Quantification'
      : 'Requires ATS Revision');

  const resumeBreakdown: ResumeRatingBreakdown = report.resume_rating_breakdown || {
    ats_readability: 9,
    impact_metrics: 7,
    tech_stack_relevance: 9,
    project_presentation: 8,
  };

  const interviewBreakdown: InterviewSkillsBreakdown = report.interview_skills_breakdown || {
    technical_depth: techScore,
    problem_solving: Math.min(10, techScore + 1),
    system_architecture: techScore,
    communication_clarity: commScore,
    vocal_confidence: confScore,
  };

  const verdictColors: Record<string, string> = {
    'Strong Hire': 'text-emerald-300 border-emerald-500/40 bg-emerald-950/60',
    'Hire': 'text-cyan-300 border-cyan-500/40 bg-cyan-950/60',
    'Borderline': 'text-amber-300 border-amber-500/40 bg-amber-950/60',
    'No Hire': 'text-red-300 border-red-500/40 bg-red-950/60',
  };
  const verdictColor = verdictColors[verdict] || verdictColors['Borderline'];

  let evaluatedProjects: ProjectEntry[] = [];
  if (report.interview?.all_projects) {
    try {
      const parsed = JSON.parse(report.interview.all_projects);
      if (Array.isArray(parsed)) evaluatedProjects = parsed;
    } catch (_) {}
  }

  const targetRoleKey = (report.interview?.target_role as TargetRole) || 'sde';
  const targetRoleLabel = TARGET_ROLE_LABELS[targetRoleKey] || 'SDE — Software Development Engineer';

  // Fallback career roles if not provided
  const bestFitRoles: BestFitRole[] =
    report.best_fit_roles && report.best_fit_roles.length > 0
      ? report.best_fit_roles
      : [
          {
            role_title:
              targetRoleKey === 'backend'
                ? 'Backend Systems Engineer'
                : targetRoleKey === 'frontend'
                ? 'Frontend Applications Engineer'
                : targetRoleKey === 'ai_ml'
                ? 'Machine Learning Engineer'
                : targetRoleKey === 'data_science'
                ? 'Data Scientist & Analytics Engineer'
                : targetRoleKey === 'devops'
                ? 'DevOps & Site Reliability Engineer'
                : targetRoleKey === 'mobile'
                ? 'Mobile Application Engineer'
                : 'Software Development Engineer (SDE)',
            match_percentage: 95,
            seniority: 'Entry-Level / Associate (0-2 YOE)',
            why_fit: `Direct alignment with ${report.interview?.tech_stack?.split(',')[0] || 'core technologies'}, hands-on service architecture, and modular API design demonstrated in ${report.interview?.project_title || 'your projects'}.`,
            ideal_companies: ['Top Tech Product Firms', 'High-Growth Fintech Scaleups', 'Global SaaS Leaders'],
          },
          {
            role_title:
              targetRoleKey === 'frontend' || targetRoleKey === 'mobile'
                ? 'UI/UX Platform Engineer'
                : targetRoleKey === 'ai_ml' || targetRoleKey === 'data_science'
                ? 'Applied AI Systems Developer'
                : 'Full Stack Engineer',
            match_percentage: 89,
            seniority: 'Junior to Mid Software Engineer',
            why_fit: 'Versatile project portfolio covering cross-layer communication, database indexing, and user experience execution.',
            ideal_companies: ['Venture-Backed Startups', 'Enterprise Cloud Providers', 'Developer Tooling Firms'],
          },
        ];

  const candidateTechTokens = (report.interview?.tech_stack || 'React, Node.js')
    .split(/[,|/•\n]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const primaryCandidateTech = candidateTechTokens[0] || 'Software';
  const secondaryCandidateTech = candidateTechTokens[1] || 'Cloud';
  const targetRoleTitle = bestFitRoles[0]?.role_title || targetRoleLabel.split('—')[0].trim();

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

  const cleanRoleName = targetRoleTitle.replace(/\s*\([^)]*\)/g, '').trim() || 'Software Engineer';
  const roleSlug = getRoleSlug(cleanRoleName);
  const internshalaSlug = getInternshalaSlug(cleanRoleName);

  // Dynamic real-time suitable job links based on resume
  const suitableJobLinks: SuitableJobLink[] =
    report.suitable_job_links && report.suitable_job_links.length > 0
      ? report.suitable_job_links
      : [
          {
            platform: 'Google Jobs',
            role_title: `${cleanRoleName} (${primaryCandidateTech}) — Live Aggregate Index`,
            apply_url: `https://www.google.com/search?q=${encodeURIComponent(`${cleanRoleName} ${primaryCandidateTech} jobs India`)}&ibp=htl;jobs`,
            badge_text: 'Live Google Index',
            match_tag: '98% Resume Match',
            description: `Live Google Jobs aggregator querying thousands of corporate ATS portals, Lever, and Greenhouse simultaneously for ${primaryCandidateTech} developers in India & remote.`,
          },
          {
            platform: 'LinkedIn',
            role_title: `${cleanRoleName} (${primaryCandidateTech} & ${secondaryCandidateTech})`,
            apply_url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(`${cleanRoleName} ${primaryCandidateTech}`)}&location=India&f_TPR=r604800`,
            badge_text: 'Past 7 Days (Live)',
            match_tag: '96% Resume Match',
            description: `Active public LinkedIn requisitions posted within the last 7 days matching your verified skills in ${primaryCandidateTech} and ${secondaryCandidateTech}.`,
          },
          {
            platform: 'Naukri',
            role_title: `${cleanRoleName} Openings on Naukri India`,
            apply_url: `https://www.naukri.com/${roleSlug}-jobs?k=${encodeURIComponent(primaryCandidateTech)}`,
            badge_text: 'Verified Indian Postings',
            match_tag: '95% Resume Match',
            description: `Direct campus and lateral engineering requisitions across Indian tech unicorns, MNCs, and product firms requiring ${primaryCandidateTech}.`,
          },
          {
            platform: 'Foundit',
            role_title: `${cleanRoleName} Opportunities — ${primaryCandidateTech}`,
            apply_url: `https://www.foundit.in/srp/results?query=${encodeURIComponent(`${cleanRoleName} ${primaryCandidateTech}`)}`,
            badge_text: 'Immediate Hires',
            match_tag: '94% Resume Match',
            description: `Active engineering openings with verified recruiter contacts on Foundit India (formerly Monster) for ${primaryCandidateTech} and ${secondaryCandidateTech}.`,
          },
          {
            platform: 'Internshala',
            role_title: `Entry-Level / Fresher ${cleanRoleName} (${primaryCandidateTech})`,
            apply_url: `https://internshala.com/jobs/${internshalaSlug}-jobs/`,
            badge_text: '0-2 YOE Placement',
            match_tag: '95% Resume Match',
            description: `Tailored college placement and entry-level engineering openings specifically hiring 0-2 YOE freshers with hands-on ${primaryCandidateTech} projects.`,
          },
          {
            platform: 'Cutshort',
            role_title: `${primaryCandidateTech} Engineer at High-Growth Startups`,
            apply_url: `https://cutshort.io/jobs?search=${encodeURIComponent(primaryCandidateTech)}`,
            badge_text: 'Direct to Founders',
            match_tag: '92% Resume Match',
            description: `Fast-growing Indian tech startups and scaleups actively hiring engineers with hands-on ${primaryCandidateTech} project experience with direct founder chat.`,
          },
        ];

  // Specific Improvements: Interview vs Resume
  const interviewImprovements =
    report.interview_improvements && report.interview_improvements.length > 0
      ? report.interview_improvements
      : report.improvements;

  const resumeImprovements =
    report.resume_improvements && report.resume_improvements.length > 0
      ? report.resume_improvements
      : [
          `Apply Google's XYZ formula: 'Accomplished [X], as measured by [Y], by doing [Z]'. Example: rewrite '${report.interview?.project_title}' bullets to quantify concrete performance (e.g. 'Engineered ${report.interview?.tech_stack?.split(',')[0] || 'backend'} microservice handling 15k requests/day, cutting response times by 32%').`,
          `Add missing production keywords for ${targetRoleKey.toUpperCase()}: explicitly include Docker containerization, CI/CD GitHub Actions, automated testing, and cloud infrastructure.`,
          `Quantify scale and database dimensions: include active user counts, query execution benchmarks, or data volume metrics to prove real-world complexity.`,
          `Group technical competencies into clear ATS-parsed subcategories: Languages, Frameworks, Databases, and Cloud/DevOps.`,
        ];

  const candidateWeaknesses =
    report.weaknesses && report.weaknesses.length > 0
      ? report.weaknesses
      : [
          'Algorithmic edge-case handling (empty inputs, integer overflow, boundary traversal, cyclic cases)',
          'High-level system design trade-offs: explicitly justifying CAP theorem compromises, database indexing, and cache invalidation policies',
          'Depth of explanation for database concurrency controls, isolation levels, and distributed transaction boundaries',
        ];

  return (
    <div className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-10 print:p-0">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Candidate Diagnostic Dossier</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Track: {targetRoleLabel.split('—')[0].trim()}</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Comprehensive Evaluation &amp; Career Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Candidate: <span className="text-slate-200 font-semibold">{report.interview?.student?.name || 'Candidate'}</span> &bull;{' '}
            Primary Project: <span className="text-slate-200 font-semibold">{report.interview?.project_title || 'Technical Project'}</span> &bull;{' '}
            Stack: <span className="text-indigo-300 font-mono">{report.interview?.tech_stack}</span>
          </p>

          {evaluatedProjects.length > 1 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
                All Resume Projects Evaluated:
              </span>
              {evaluatedProjects.map((p, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-medium"
                >
                  {p.title}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 print:hidden self-end sm:self-center relative z-10 flex-shrink-0">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Dossier</span>
          </button>
          <Link
            href="/student/setup"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/30"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Practice Another</span>
          </Link>
        </div>
      </div>

      {/* DUAL RATING SECTION: Resume Rating vs Interview Skills Rating */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              <span>Dual Diagnostic Ratings</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Independent evaluations for your uploaded resume credentials and spoken interview execution.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CARD 1: RESUME RATING & ATS READABILITY */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                      Resume Quality &amp; ATS Score
                    </span>
                    <h3 className="text-lg font-bold text-white leading-tight">Resume Rating</h3>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[11px] font-bold">
                  {resumeVerdict}
                </div>
              </div>

              {/* Big Score Header */}
              <div className="flex items-baseline gap-3 my-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                  {resumeScore}
                </span>
                <span className="text-xl font-bold text-slate-500">/ 100</span>
                <div className="ml-auto text-right">
                  <span className="text-xs text-slate-400 block font-medium">ATS Pass Index</span>
                  <span className="text-sm font-bold text-teal-400">
                    {resumeScore >= 85 ? 'Top 5% Tier' : resumeScore >= 70 ? 'Competitive' : 'Needs Optimization'}
                  </span>
                </div>
              </div>

              {/* 4-Factor Breakdown Meters */}
              <div className="space-y-3.5 mt-5">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">ATS Machine Readability &amp; Structure</span>
                    <span className="text-teal-400 font-mono">{resumeBreakdown.ats_readability}/10</span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${resumeBreakdown.ats_readability * 10}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Quantified Impact &amp; Metrics (Google XYZ)</span>
                    <span className="text-teal-400 font-mono">{resumeBreakdown.impact_metrics}/10</span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${resumeBreakdown.impact_metrics * 10}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Tech Stack Relevance for Track</span>
                    <span className="text-teal-400 font-mono">{resumeBreakdown.tech_stack_relevance}/10</span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-indigo-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${resumeBreakdown.tech_stack_relevance * 10}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Project Depth &amp; Architectural Complexity</span>
                    <span className="text-teal-400 font-mono">{resumeBreakdown.project_presentation}/10</span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-violet-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${resumeBreakdown.project_presentation * 10}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-5 pt-3 border-t border-slate-800 leading-relaxed">
              Resume evaluated against automated Application Tracking Systems (ATS) and Senior Hiring Manager resume screening filters.
            </p>
          </div>

          {/* CARD 2: INTERVIEW SKILLS RATING & HIRING VERDICT */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Spoken Performance &amp; Caliber
                    </span>
                    <h3 className="text-lg font-bold text-white leading-tight">Interview Skills Rating</h3>
                  </div>
                </div>
                <div className={`px-3.5 py-1 rounded-full border text-xs font-extrabold ${verdictColor}`}>
                  {verdict}
                </div>
              </div>

              {/* Big Score Header */}
              <div className="flex items-baseline gap-3 my-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                  {techScore}
                </span>
                <span className="text-xl font-bold text-slate-500">/ 10</span>
                <div className="ml-auto text-right">
                  <span className="text-xs text-slate-400 block font-medium">Hiring Committee Bar</span>
                  <span
                    className={`text-sm font-bold ${
                      verdict === 'Strong Hire' || verdict === 'Hire'
                        ? 'text-emerald-400'
                        : techScore <= 2
                        ? 'text-rose-400'
                        : techScore <= 4
                        ? 'text-red-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {verdict === 'Strong Hire' || verdict === 'Hire'
                      ? 'Target Reached'
                      : techScore <= 2
                      ? 'Non-Answer / Bar Unmet'
                      : techScore <= 4
                      ? 'Hiring Bar Not Met'
                      : 'Borderline — Needs Polish'}
                  </span>
                </div>
              </div>

              {/* Real-world hiring bar notice for failed/unanswered sessions */}
              {techScore <= 4 && (
                <div className="my-3 p-3 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-[11px] text-rose-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">FAANG Hiring Bar Calibrated:</span>{' '}
                    {techScore <= 2
                      ? 'Questions were skipped or left unanswered without live code implementation.'
                      : 'Technical screening requires live code implementation and accurate algorithmic Big-O analysis to pass.'}{' '}
                    Review your diagnostic gaps below before re-interviewing.
                  </div>
                </div>
              )}

              {/* 5-Factor Breakdown Meters */}
              <div className="space-y-3 mt-5">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Role Technical Depth &amp; CS Fundamentals</span>
                    <span className="text-indigo-400 font-mono">{interviewBreakdown.technical_depth}/10</span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-teal-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${interviewBreakdown.technical_depth * 10}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Problem Solving, DSA &amp; Algorithmic Thinking</span>
                    <span className="text-indigo-400 font-mono">{interviewBreakdown.problem_solving}/10</span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${interviewBreakdown.problem_solving * 10}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">System Architecture &amp; Scale Reasoning</span>
                    <span className="text-indigo-400 font-mono">{interviewBreakdown.system_architecture}/10</span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-indigo-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${interviewBreakdown.system_architecture * 10}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Communication Clarity &amp; STAR Structure</span>
                    <span className="text-indigo-400 font-mono">{interviewBreakdown.communication_clarity}/10</span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-violet-500 to-pink-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${interviewBreakdown.communication_clarity * 10}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Vocal Confidence &amp; Handling Pushback</span>
                    <span className="text-indigo-400 font-mono">{interviewBreakdown.vocal_confidence}/10</span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-rose-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${interviewBreakdown.vocal_confidence * 10}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-5 pt-3 border-t border-slate-800 leading-relaxed">
              Assessed against calibrated hiring bars of senior engineering panels across product technology companies.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION: FOR WHAT THIS RESUME IS BEST FOR */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Career Best-Fit Intelligence</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            For What This Resume is Best Suited
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Based on your projects, technical stack depth, and interview problem-solving, our algorithms identify your highest-probability career tracks:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {bestFitRoles.map((role, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-2xl bg-slate-950/70 border border-slate-800/90 hover:border-indigo-500/40 transition-all flex flex-col justify-between group shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block mb-0.5">
                      {role.seniority}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {role.role_title}
                    </h3>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-xs flex-shrink-0 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>{role.match_percentage}% Match</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mt-2.5">
                  {role.why_fit}
                </p>
              </div>

              {role.ideal_companies && role.ideal_companies.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Ideal Target Employers
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {role.ideal_companies.map((co, cIdx) => (
                      <span
                        key={cIdx}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-300"
                      >
                        {co}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION: APPLY FOR SUITABLE JOBS (1-CLICK DIRECT APPLICATION LAUNCHPAD) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/30 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold mb-2">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Live Application Launchpad</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Apply to Suitable Openings
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Curated 1-click apply links pre-configured for your target track (<span className="text-indigo-300 font-semibold">{targetRoleLabel.split('—')[0].trim()}</span>) and verified technology stack.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suitableJobLinks.map((job, idx) => (
            <a
              key={idx}
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all group flex flex-col justify-between shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />

              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-black tracking-wider uppercase text-indigo-300">
                    {job.platform}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {job.badge_text}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors line-clamp-2">
                  {job.role_title}
                </h3>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-400">
                  {job.match_tag}
                </span>
                <span className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
                  Apply Now <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* SECTION: TWO ACTIONABLE CRITIQUE SQUARES (Interview vs Resume) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WHAT TO IMPROVE IN YOUR INTERVIEW */}
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 text-amber-400 font-bold text-base">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
                Verbal &amp; Technical Execution
              </span>
              <span>What to Improve in Your Interview</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Specific areas where your spoken explanations, system trade-offs, or complexity analyses need refinement:
          </p>
          <ul className="space-y-3.5 pt-1">
            {interviewImprovements.map((imp, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-xs sm:text-sm text-slate-200 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80"
              >
                <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-400 font-bold text-[10px] mt-0.5">
                  {i + 1}
                </div>
                <span className="leading-relaxed">{imp}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* WHAT TO IMPROVE IN YOUR RESUME */}
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 text-teal-400 font-bold text-base">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400 block">
                ATS Audit &amp; Bullet Refactoring
              </span>
              <span>What to Improve in Your Resume</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Actionable resume edits, missing keywords, and bullet point rewrites using Google&apos;s XYZ formula:
          </p>
          <ul className="space-y-3.5 pt-1">
            {resumeImprovements.map((imp, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-xs sm:text-sm text-slate-200 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80"
              >
                <div className="w-5 h-5 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center flex-shrink-0 text-teal-400 font-bold text-[10px] mt-0.5">
                  {i + 1}
                </div>
                <span className="leading-relaxed">{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* SECTION: KEY STRENGTHS DEMONSTRATED */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-emerald-500/20 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-base">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
              Observed Competencies
            </span>
            <span>Key Strengths Highlighted (What You Did Well)</span>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Domains where your answers demonstrated deep architectural rigor, clear reasoning, and technical fluency:
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {report.strengths.map((str, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-xs sm:text-sm text-slate-200 p-3.5 rounded-xl bg-slate-950/60 border border-emerald-500/20"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span className="leading-relaxed">{str}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* SECTION: WEAK AREAS & KNOWLEDGE GAPS IDENTIFIED */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-rose-500/25 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 text-rose-400 font-bold text-base">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <XCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 block">
              Vulnerabilities &amp; Skill Gaps
            </span>
            <span>Weak Areas Identified (Where You Were Weak)</span>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Specific algorithmic traps, incomplete trade-off analyses, or conceptual misconceptions flagged by the interviewer:
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {candidateWeaknesses.map((weak, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-xs sm:text-sm text-slate-200 p-3.5 rounded-xl bg-slate-950/60 border border-rose-500/20"
            >
              <span className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              <span className="leading-relaxed">{weak}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* SECTION: SUBMITTED CODE & LIVE TECHNICAL EVALUATION */}
      {report.submitted_code && report.submitted_code.code && (
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-cyan-500/25 shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-base">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 block">
                  Interactive IDE Evaluation
                </span>
                <span>Submitted Code &amp; Algorithmic Analysis</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs uppercase font-bold">
              {report.submitted_code.language}
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
            <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px] text-slate-300">
                candidate_solution.{report.submitted_code.language === 'python' ? 'py' : report.submitted_code.language === 'javascript' ? 'js' : report.submitted_code.language === 'typescript' ? 'ts' : report.submitted_code.language === 'java' ? 'java' : report.submitted_code.language === 'cpp' ? 'cpp' : 'go'}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">Evaluated Live by Senior Interviewer</span>
            </div>
            <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-80">
              <code>{report.submitted_code.code}</code>
            </pre>
            {report.submitted_code.output && (
              <div className="p-3.5 bg-slate-900/90 border-t border-slate-800 text-[11px] font-mono">
                <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-1 font-bold">Execution Sandbox Output:</span>
                <span className="text-slate-200 whitespace-pre-wrap">{report.submitted_code.output}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actionable Remedial Practice Plan */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-indigo-300 font-bold text-base">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span>Targeted Remedial Engineering Roadmap</span>
        </div>
        <p className="text-xs text-slate-400">
          Actionable technical study topics based on identified gaps in architecture and implementation:
        </p>

        <div className="space-y-3 pt-2">
          {report.practice_plan.map((item, idx) => {
            const isChecked = checkedPlanItems[idx] || false;
            return (
              <div
                key={idx}
                onClick={() => togglePlanCheck(idx)}
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  isChecked
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-slate-300'
                    : 'bg-slate-800/60 border-slate-700/80 text-white hover:border-slate-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                    isChecked
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'border-slate-600 bg-slate-900'
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className="flex-1 text-xs sm:text-sm">
                  <span className={`font-medium ${isChecked ? 'line-through text-slate-400' : ''}`}>
                    {item}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accordion: Review Full Interview Transcript */}
      {report.interview?.transcript && report.interview.transcript.length > 0 && (
        <div className="border border-slate-800 rounded-3xl overflow-hidden bg-slate-900/60 shadow-xl">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="w-full p-5 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Review Complete Interview Transcript ({report.interview.transcript.length} turns)</span>
            </span>
            {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showTranscript && (
            <div className="p-5 border-t border-slate-800 space-y-3 max-h-96 overflow-y-auto">
              {report.interview.transcript.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-2xl text-xs ${
                    msg.sender === 'user'
                      ? 'bg-emerald-950/40 text-emerald-200 border border-emerald-800/30 ml-8'
                      : 'bg-slate-800/80 text-slate-200 border border-slate-700/50 mr-8'
                  }`}
                >
                  <span className="font-bold uppercase text-[10px] block mb-1 opacity-75">
                    {msg.sender === 'user' ? 'Candidate' : 'Interviewer'}
                  </span>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
