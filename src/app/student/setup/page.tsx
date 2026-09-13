'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Code2,
  FolderGit2,
  User,
  GraduationCap,
  BookOpen,
  AlertCircle,
  Check,
  X,
  Plus,
  Trash2,
  Cpu,
  Brain,
  Layout,
  Server,
  Layers,
  BarChart3,
  Terminal,
  Smartphone,
  Star,
  Zap,
  Lock,
  TrendingUp,
  Award,
  Calendar,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  History,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ParsedResume, TargetRole, ProjectEntry, TARGET_ROLE_LABELS } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';


interface RoleOption {
  id: TargetRole;
  title: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  { id: 'sde', title: 'Software Engineer (SDE)', badge: 'DSA & Systems', icon: Cpu, accentColor: 'text-indigo-400' },
  { id: 'ai_ml', title: 'AI / Machine Learning', badge: 'Deep Learning & MLOps', icon: Brain, accentColor: 'text-violet-400' },
  { id: 'backend', title: 'Backend Engineer', badge: 'Distributed & DBs', icon: Server, accentColor: 'text-emerald-400' },
  { id: 'frontend', title: 'Frontend Engineer', badge: 'React & Web Perf', icon: Layout, accentColor: 'text-cyan-400' },
  { id: 'fullstack', title: 'Full Stack Engineer', badge: 'End-to-End & APIs', icon: Layers, accentColor: 'text-amber-400' },
  { id: 'data_science', title: 'Data Scientist', badge: 'Stats & Modeling', icon: BarChart3, accentColor: 'text-pink-400' },
  { id: 'devops', title: 'DevOps / SRE', badge: 'K8s & Cloud Infra', icon: Terminal, accentColor: 'text-rose-400' },
  { id: 'mobile', title: 'Mobile Engineer', badge: 'iOS & Android', icon: Smartphone, accentColor: 'text-teal-400' },
];

export default function StudentSetupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isSubscribed, openSubscriptionModal, hasUsedFreeTrial } = useAuth();

  // Form State
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('Computer Science');
  const [targetRole, setTargetRole] = useState<TargetRole>('sde');
  const [suggestedRole, setSuggestedRole] = useState<TargetRole | null>(null);

  useEffect(() => {
    if (user?.name && !name) {
      setName(user.name);
    }
  }, [user, name]);


  // Primary Project Fields
  const [projectTitle, setProjectTitle] = useState('');
  const [techStack, setTechStack] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [resumeSummary, setResumeSummary] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [interviewerPersona, setInterviewerPersona] = useState<'alex' | 'sophia'>('alex');

  // Multi-Project State
  const [allProjects, setAllProjects] = useState<ProjectEntry[]>([]);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectTech, setNewProjectTech] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [showAddProjectForm, setShowAddProjectForm] = useState(false);

  // Status & Progress
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [parseSuccess, setParseSuccess] = useState(false);
  const [parsedHighlights, setParsedHighlights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Candidate Interview Journey & Growth Tracking State
  const [activeTab, setActiveTab] = useState<'setup' | 'growth'>('setup');
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyStats, setHistoryStats] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchInterviewHistory = async () => {
    if (!user) return;
    try {
      setHistoryLoading(true);
      const params = new URLSearchParams();
      if (user.id) params.append('userId', user.id);
      if (user.email) params.append('email', user.email);
      if (user.name) params.append('name', user.name);

      const res = await fetch(`/api/student/history?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.history || []);
        setHistoryStats(data.stats || null);
      }
    } catch (err) {
      console.warn('Failed to load candidate interview history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInterviewHistory();
    }
  }, [user]);

  // Handle Resume File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingResume(true);
    setErrorMessage('');
    setParseSuccess(false);
    setParsedHighlights([]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to parse resume.');
      }

      const data = await res.json();
      if (!data.parsed) {
        throw new Error('Could not extract resume information.');
      }

      const parsed: ParsedResume = data.parsed;

      if (parsed.candidateName) setName(parsed.candidateName);
      if (parsed.branch) setBranch(parsed.branch);

      const extractedProjects: ProjectEntry[] = Array.isArray(parsed.allProjects) && parsed.allProjects.length > 0
        ? parsed.allProjects
        : [];

      const mainTitle = parsed.projectTitle || extractedProjects[0]?.title || '';
      const mainTech = parsed.techStack || extractedProjects[0]?.techStack || '';
      const mainDesc = parsed.projectDescription || extractedProjects[0]?.description || '';

      setProjectTitle(mainTitle);
      setTechStack(mainTech);
      setProjectDescription(mainDesc);
      setResumeSummary(parsed.resumeSummary || '');

      if (extractedProjects.length > 0) {
        setAllProjects(extractedProjects);
      } else if (mainTitle) {
        setAllProjects([{ title: mainTitle, techStack: mainTech, description: mainDesc }]);
      }

      if (parsed.suggestedRole) {
        setTargetRole(parsed.suggestedRole);
        setSuggestedRole(parsed.suggestedRole);
      }

      if (Array.isArray(parsed.keyHighlights) && parsed.keyHighlights.length > 0) {
        setParsedHighlights(parsed.keyHighlights);
      }

      setResumeFileName(file.name);
      setParseSuccess(true);
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMessage(err.message || 'Error parsing resume.');
      setParseSuccess(false);
    } finally {
      setIsParsingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };


  const clearForm = () => {
    setName('');
    setProjectTitle('');
    setTechStack('');
    setProjectDescription('');
    setResumeSummary('');
    setResumeFileName('');
    setAllProjects([]);
    setSuggestedRole(null);
    setParseSuccess(false);
    setParsedHighlights([]);
    setErrorMessage('');
  };

  const selectPrimaryProject = (proj: ProjectEntry) => {
    setProjectTitle(proj.title);
    setTechStack(proj.techStack);
    setProjectDescription(proj.description);
  };

  const handleAddNewProject = () => {
    if (!newProjectTitle.trim() || !newProjectTech.trim()) return;
    const newProj: ProjectEntry = {
      title: newProjectTitle.trim(),
      techStack: newProjectTech.trim(),
      description: newProjectDesc.trim(),
    };
    const updated = [...allProjects, newProj];
    setAllProjects(updated);
    if (!projectTitle) {
      selectPrimaryProject(newProj);
    }
    setNewProjectTitle('');
    setNewProjectTech('');
    setNewProjectDesc('');
    setShowAddProjectForm(false);
  };

  const handleRemoveProject = (index: number) => {
    const updated = allProjects.filter((_, i) => i !== index);
    setAllProjects(updated);
    if (updated.length > 0 && allProjects[index]?.title === projectTitle) {
      selectPrimaryProject(updated[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Mandatory Signup Gate
    if (!user) {
      setErrorMessage('Please sign up or sign in to start your technical mock interview. Every candidate gets 1 Free Technical Interview.');
      router.push('/signup?redirect=/student/setup');
      return;
    }

    // 2. Paywall Gate: If free trial used and not subscribed, open Razorpay modal
    if (hasUsedFreeTrial && !isSubscribed) {
      setErrorMessage('You have already completed your 1 free interview trial. Please subscribe to AceInterview Pro (₹99/month) for unlimited technical evaluations.');
      openSubscriptionModal();
      return;
    }

    if (!name.trim() || !projectTitle.trim() || !techStack.trim()) {
      setErrorMessage('Full name, project title, and tech stack are required.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    let finalProjects = [...allProjects];
    const exists = finalProjects.some((p) => p.title.toLowerCase() === projectTitle.trim().toLowerCase());
    if (!exists) {
      finalProjects.unshift({
        title: projectTitle.trim(),
        techStack: techStack.trim(),
        description: projectDescription.trim(),
      });
    }

    try {
      const res = await fetch('/api/student/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          branch,
          projectTitle: projectTitle.trim(),
          techStack: techStack.trim(),
          projectDescription: projectDescription.trim(),
          resumeSummary: resumeSummary.trim(),
          resumeFileName: resumeFileName || 'resume.pdf',
          interviewerPersona,
          allProjects: finalProjects,
          targetRole,
          userId: user?.id,
        }),
      });

      if (res.status === 401) {
        const authData = await res.json().catch(() => ({}));
        setErrorMessage(authData.message || 'Please sign in or create an account to start your free interview.');
        setIsLoading(false);
        router.push('/signup?redirect=/student/setup');
        return;
      }

      if (res.status === 402) {
        const paywallData = await res.json().catch(() => ({}));
        setErrorMessage(paywallData.message || 'Free trial evaluation used. Upgrade to AceInterview Pro (₹99/mo) for unlimited interviews.');
        setIsLoading(false);
        openSubscriptionModal();
        return;
      }

      if (!res.ok) throw new Error('Session initialization failed.');


      const data = await res.json();
      if (typeof window !== 'undefined' && data.interviewId) {
        try {
          sessionStorage.setItem(
            `interview_${data.interviewId}`,
            JSON.stringify({
              id: data.interviewId,
              student_id: data.studentId,
              student: { name: name.trim(), branch },
              project_title: projectTitle.trim(),
              tech_stack: techStack.trim(),
              project_description: projectDescription.trim(),
              resume_summary: resumeSummary.trim(),
              interviewer_persona: interviewerPersona,
              target_role: targetRole,
              all_projects: JSON.stringify(finalProjects),
              transcript: [],
              status: 'in_progress',
            })
          );
        } catch (_) {}
      }
      router.push(`/student/interview/${data.interviewId}`);
    } catch (err: any) {
      console.error('Setup error:', err);
      setErrorMessage(err.message || 'Error initializing assessment session.');
      setIsLoading(false);
    }
  };

  const isFormReady = Boolean(name.trim() && projectTitle.trim() && techStack.trim());

  return (
    <div className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Candidate Assessment Setup
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Upload your resume to extract your projects and role, or choose a preset to begin.
        </p>

        {/* Subscription & Trial Status Banner */}
        <div className="pt-2 flex justify-center w-full">
          {!user ? (
            <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-indigo-950/80 border border-indigo-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Sign up to claim your 1 Free Interview</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">1 Free Trial</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Account required to track your performance, ATS score, and diagnostic report. After 1 interview, upgrade for ₹99 for unlimited mocks.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <Link
                  href="/login?redirect=/student/setup"
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup?redirect=/student/setup"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition hover:scale-105"
                >
                  Sign Up Free &rarr;
                </Link>
              </div>
            </div>
          ) : isSubscribed ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>AceInterview Pro Active &bull; Unlimited Autonomous Interviews Enabled</span>
            </div>
          ) : hasUsedFreeTrial ? (
            <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs font-medium">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Free trial completed (1 of 1 interview used).</span>
              <button
                type="button"
                onClick={openSubscriptionModal}
                className="ml-1 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs shadow cursor-pointer transition"
              >
                Upgrade to Pro (₹99/mo) &rarr;
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Account Active ({user.email}) &bull; 1 Free Interview Trial Ready</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Switcher: Setup vs Growth & Journey */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('setup')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'setup'
              ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span>Setup New Interview</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('growth');
            fetchInterviewHistory();
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'growth'
              ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>My Growth & History</span>
          {historyList.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
              {historyList.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'setup' && (
        <>
          {/* Resume Upload Box */}
          <div
        className="p-6 rounded-2xl bg-slate-900/60 border border-dashed border-slate-700 hover:border-indigo-500/80 transition-all text-center group cursor-pointer backdrop-blur-sm"
        onClick={() => !isParsingResume && fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file && fileInputRef.current) {
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInputRef.current.files = dt.files;
            handleFileUpload({ target: fileInputRef.current } as any);
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2.5">
          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
            {isParsingResume ? (
              <div className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
            ) : parseSuccess ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">
              {isParsingResume
                ? 'Parsing resume...'
                : parseSuccess
                ? `Extracted from: ${resumeFileName}`
                : 'Upload Resume (PDF, TXT, DOCX)'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {parseSuccess
                ? 'Projects and target track extracted below. Adjust anytime.'
                : 'Drag and drop your resume file or click to browse.'}
            </p>
          </div>

          {parsedHighlights.length > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-left w-full max-w-lg space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                Extracted Highlights
              </span>
              {parsedHighlights.map((hl, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>{hl}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* ── ROLE SELECTION ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Target Engineering Track
          </label>
          {suggestedRole && (
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Suggested from Resume
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {ROLE_OPTIONS.map((role) => {
            const Icon = role.icon;
            const isSelected = targetRole === role.id;

            return (
              <div
                key={role.id}
                onClick={() => setTargetRole(role.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-4 h-4 ${isSelected ? role.accentColor : 'text-slate-500'}`} />
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-400">
                    {role.badge}
                  </span>
                </div>
                <div className="text-xs font-bold leading-tight">{role.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── INTERVIEWER SELECTION ── */}
      <div className="space-y-2.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Interviewer Persona
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            onClick={() => setInterviewerPersona('alex')}
            className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
              interviewerPersona === 'alex'
                ? 'bg-slate-900 border-cyan-500/70 shadow-lg ring-1 ring-cyan-500/50'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0">
              <Image src="/images/interviewer_alex.jpg" alt="Aarav Sharma" fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Aarav Sharma</span>
                <span className="text-[10px] text-cyan-300 font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 font-semibold">
                  Male Indian Voice 👨‍💼
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">Staff Lead • Algorithms &amp; Architecture</p>
            </div>
          </div>

          <div
            onClick={() => setInterviewerPersona('sophia')}
            className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
              interviewerPersona === 'sophia'
                ? 'bg-slate-900 border-indigo-500/70 shadow-lg ring-1 ring-indigo-500/50'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0">
              <Image src="/images/interviewer_sophia.jpg" alt="Priya Patel" fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Priya Patel</span>
                <span className="text-[10px] text-indigo-300 font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/40 font-semibold">
                  Female Indian Voice 👩‍💼
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">Principal Architect • Systems &amp; Distributed Scale</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── PROFILE & PROJECTS FORM ── */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-7 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">Candidate Profile</span>
          {(name || projectTitle || techStack) && (
            <button type="button" onClick={clearForm} className="text-xs text-slate-500 hover:text-red-400">
              Clear
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Candidate Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Engineering Focus</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 text-xs sm:text-sm"
            >
              <option value="Computer Science">Computer Science &amp; Systems</option>
              <option value="Data Science & AI">Data Science &amp; Machine Learning</option>
              <option value="Information Systems">Information Systems</option>
              <option value="Electrical & Electronics">Electrical &amp; Embedded</option>
            </select>
          </div>
        </div>

        {/* ── PROJECTS LIST ── */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800/70">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-300">
                Projects in Scope ({allProjects.length || (projectTitle ? 1 : 0)})
              </span>
              <p className="text-[11px] text-slate-500">The interviewer drills across all projects in scope.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddProjectForm(!showAddProjectForm)}
              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddProjectForm ? 'Cancel' : 'Add Project'}</span>
            </button>
          </div>

          {showAddProjectForm && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="Project Name"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={newProjectTech}
                  onChange={(e) => setNewProjectTech(e.target.value)}
                  placeholder="Tech Stack (e.g. Go, Kafka, Redis)"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <textarea
                rows={2}
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="Core architecture and key mechanisms..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProjectForm(false)}
                  className="px-3 py-1 rounded text-xs text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddNewProject}
                  disabled={!newProjectTitle.trim() || !newProjectTech.trim()}
                  className="px-3 py-1 rounded text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {allProjects.map((proj, idx) => {
              const isPrimary = proj.title.toLowerCase() === projectTitle.trim().toLowerCase();

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                    isPrimary
                      ? 'bg-indigo-950/30 border-indigo-500/50 text-white'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate">{proj.title}</span>
                      {isPrimary ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                          Primary
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => selectPrimaryProject(proj)}
                          className="text-[10px] text-slate-500 hover:text-indigo-400 underline"
                        >
                          Make Primary
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">{proj.techStack}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveProject(idx)}
                    className="text-slate-600 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── PRIMARY PROJECT DETAILS ── */}
        <div className="space-y-4 pt-2 border-t border-slate-800/70">
          <span className="text-xs font-semibold text-slate-300">Primary Project Details</span>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Project Title *</label>
            <input
              type="text"
              required
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="e.g. Distributed Task Engine"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Tech Stack *</label>
            <input
              type="text"
              required
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="e.g. React, Node.js, PostgreSQL, Redis, Docker"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs sm:text-sm font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Architecture &amp; Technical Decisions</label>
            <textarea
              rows={3}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Key workflows, database design, concurrency handling, and trade-offs..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {!user ? (
            <Link
              href="/signup?redirect=/student/setup"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 transition-all shadow-lg shadow-indigo-600/30 text-sm"
            >
              <span>Sign Up to Claim 1 Free Interview</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : hasUsedFreeTrial && !isSubscribed ? (
            <button
              type="button"
              onClick={openSubscriptionModal}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-amber-600 via-indigo-600 to-indigo-700 hover:from-amber-500 hover:to-indigo-600 transition-all shadow-lg shadow-amber-600/25 text-sm cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Upgrade to Pro (₹99/mo) to Launch Interview</span>
              <Zap className="w-4 h-4 text-amber-300" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading || !isFormReady}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-40 text-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Initializing Interviewer...</span>
                </>
              ) : (
                <>
                  <span>Begin Technical Assessment</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </>
  )}

  {/* Active Tab: My Growth & Interview Journey */}
  {activeTab === 'growth' && (
    <div className="space-y-6">
      {/* Top Aggregated Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-indigo-400" />
            Interviews Taken
          </div>
          <div className="text-2xl font-black text-white">
            {historyStats?.totalInterviews || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Total sessions completed</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Avg Tech Score
          </div>
          <div className="text-2xl font-black text-cyan-400">
            {historyStats?.avgTechScore ? `${historyStats.avgTechScore}/10` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Coding & System Design</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            Communication
          </div>
          <div className="text-2xl font-black text-purple-400">
            {historyStats?.avgCommScore ? `${historyStats.avgCommScore}/10` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Clarity & Articulation</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            Best Score
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {historyStats?.bestScore ? `${historyStats.bestScore}/10` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Top session achievement</div>
        </div>
      </div>

      {/* Visual Growth Trend Chart */}
      {historyStats?.growthTrend && historyStats.growthTrend.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Performance Trajectory & Growth Curve
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Progression of your technical competence and overall hireability across assessments.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchInterviewHistory}
              disabled={historyLoading}
              className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              title="Refresh interview history"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyStats.growthTrend}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="techGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="session" stroke="#64748b" fontSize={11} />
                <YAxis domain={[0, 10]} stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="overall"
                  name="Overall Score"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#growthGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="tech"
                  name="Technical Score"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#techGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Previous Interviews Records */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Previous Interview Dossiers ({historyList.length})
          </h3>
        </div>

        {historyList.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No Previous Interviews Recorded</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Complete your first autonomous AI mock interview now to receive detailed speech feedback, ATS score, and permanent growth tracking.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('setup')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow transition cursor-pointer"
            >
              Start First Interview &rarr;
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {historyList.map((item, idx) => (
              <div
                key={item.interviewId || idx}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                      {item.targetRole?.toUpperCase() || 'SDE'}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {item.projectTitle || 'General Engineering Assessment'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Interviewer: {item.persona === 'sophia' ? 'Priya Patel' : 'Aarav Sharma'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}</span>
                    <span>&bull;</span>
                    <span className="font-semibold text-slate-300">
                      Verdict: <span className="text-emerald-400">{item.verdict}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2 text-right">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Overall</div>
                      <div className="text-sm font-black text-emerald-400">{item.overallScore}/10</div>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Tech</div>
                      <div className="text-sm font-black text-cyan-400">{item.technicalScore}/10</div>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Comm</div>
                      <div className="text-sm font-black text-purple-400">{item.communicationScore}/10</div>
                    </div>
                  </div>

                  <Link
                    href={`/student/report/${item.interviewId}`}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>View Report</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )}
</div>
  );
}
