'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Award,
  TrendingUp,
  BarChart3,
  Search,
  Download,
  ArrowUpRight,
  Filter,
  CheckCircle,
  Sparkles,
  Shield,
  ShieldCheck,
  Zap,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  Mail,
  Calendar,
  ShieldAlert,
  Eye,
  Briefcase,
  Plus,
  Trash2,
  ExternalLink,
  Globe,
  Building2,
  Newspaper,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { DepartmentMetrics, User, LiveJobPosting, JobNewsItem } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { CandidateDossierModal } from '@/components/CandidateDossierModal';

export default function AdminDashboardPage() {
  const { user, loading: authLoading, canAccessDashboard, logout } = useAuth();
  const [metrics, setMetrics] = useState<DepartmentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'jobs'>('analytics');

  // User Accounts & Power Delegation State
  const [users, setUsers] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Jobs & News Management State
  const [jobsList, setJobsList] = useState<LiveJobPosting[]>([]);
  const [newsList, setNewsList] = useState<JobNewsItem[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsSubTab, setJobsSubTab] = useState<'postings' | 'news'>('postings');
  const [showJobForm, setShowJobForm] = useState(false);
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [jobSubmitLoading, setJobSubmitLoading] = useState(false);

  // New Job Form State
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobCompany, setNewJobCompany] = useState('');
  const [newJobTrack, setNewJobTrack] = useState('SDE');
  const [newJobLocation, setNewJobLocation] = useState('');
  const [newJobType, setNewJobType] = useState('Full-time');
  const [newJobExp, setNewJobExp] = useState<'fresher' | '1-3' | '3-5' | '5+'>('fresher');
  const [newJobSalary, setNewJobSalary] = useState('');
  const [newJobPlatform, setNewJobPlatform] = useState('LinkedIn');
  const [newJobApplyUrl, setNewJobApplyUrl] = useState('');
  const [newJobTags, setNewJobTags] = useState('');
  const [newJobFresherEligible, setNewJobFresherEligible] = useState(true);

  // New News Form State
  const [newNewsHeadline, setNewNewsHeadline] = useState('');
  const [newNewsCompany, setNewNewsCompany] = useState('');
  const [newNewsTag, setNewNewsTag] = useState<'Hiring' | 'Layoff' | 'Funding' | 'Campus Drive'>('Hiring');
  const [newNewsSummary, setNewNewsSummary] = useState('');
  const [newNewsSource, setNewNewsSource] = useState('');
  const [newNewsUrl, setNewNewsUrl] = useState('');
  const [newNewsFreshersOnly, setNewNewsFreshersOnly] = useState(false);

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error('Failed to fetch user accounts:', e);
    }
  };

  const fetchJobsData = async () => {
    setJobsLoading(true);
    try {
      const res = await fetch('/api/jobs?type=all');
      if (res.ok) {
        const data = await res.json();
        setJobsList(data.jobs || []);
        setNewsList(data.news || []);
      }
    } catch (err) {
      console.error('Failed to fetch jobs data:', err);
    } finally {
      setJobsLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: string, value?: any, role?: string) => {
    setActionLoading(`${userId}_${action}`);
    try {
      const res = await fetch('/api/auth/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, value, role }),
      });
      if (res.ok) {
        await fetchUsers();
      }
    } catch (e) {
      console.error('User action failed:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle || !newJobCompany || !newJobApplyUrl) {
      alert('Please fill in Job Title, Company, and Apply URL.');
      return;
    }
    setJobSubmitLoading(true);
    try {
      const tagsArray = newJobTags.split(',').map((t) => t.trim()).filter(Boolean);
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          entityType: 'job',
          data: {
            roleTitle: newJobTitle,
            companyName: newJobCompany,
            targetTrack: (newJobTrack.toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'sde') as any,
            location: newJobLocation || 'Remote / Hybrid',
            experienceLevel: newJobExp === 'fresher' ? 'Freshers (0-1 YOE)' : newJobExp === '1-3' ? 'Associate (1-3 YOE)' : 'Mid-Senior (3+ YOE)',
            salaryOrStipend: newJobSalary || undefined,
            platform: newJobPlatform as any,
            applyUrl: newJobApplyUrl,
            tags: tagsArray.length > 0 ? tagsArray : [newJobTrack],
            isNewThisWeek: true,
            postedDate: 'Just now',
            batchOrEligibility: newJobFresherEligible ? 'Freshers Welcome' : 'Experience Required',
          },
        }),
      });
      if (res.ok) {
        setNewJobTitle('');
        setNewJobCompany('');
        setNewJobLocation('');
        setNewJobSalary('');
        setNewJobApplyUrl('');
        setNewJobTags('');
        setShowJobForm(false);
        await fetchJobsData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to post job');
      }
    } catch (err) {
      console.error('Failed to create job:', err);
    } finally {
      setJobSubmitLoading(false);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to remove this job posting?')) return;
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', entityType: 'job', id }),
      });
      if (res.ok) {
        await fetchJobsData();
      }
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNewsHeadline || !newNewsCompany || !newNewsSummary) {
      alert('Please fill in Headline, Company, and Summary.');
      return;
    }
    setJobSubmitLoading(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          entityType: 'news',
          data: {
            headline: newNewsHeadline,
            companyName: newNewsCompany,
            tag: newNewsTag,
            summary: newNewsSummary,
            source: newNewsSource || 'Placement Network',
            linkUrl: newNewsUrl || 'https://www.linkedin.com',
            track: 'all',
            experienceLevel: newNewsFreshersOnly ? 'freshers' : 'all',
            date: 'Just now',
            isNewThisWeek: true,
          },
        }),
      });
      if (res.ok) {
        setNewNewsHeadline('');
        setNewNewsCompany('');
        setNewNewsSummary('');
        setNewNewsSource('');
        setNewNewsUrl('');
        setShowNewsForm(false);
        await fetchJobsData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to post news');
      }
    } catch (err) {
      console.error('Failed to create news:', err);
    } finally {
      setJobSubmitLoading(false);
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('Are you sure you want to delete this news announcement?')) return;
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', entityType: 'news', id }),
      });
      if (res.ok) {
        await fetchJobsData();
      }
    } catch (err) {
      console.error('Failed to delete news:', err);
    }
  };

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/admin/metrics');
        if (res.status === 403 || res.status === 401) {
          setMetrics(null);
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch metrics');
        const data = await res.json();
        setMetrics(data.metrics);
      } catch (err) {
        console.error('Error fetching admin metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    if (canAccessDashboard) {
      fetchMetrics();
      fetchUsers();
      fetchJobsData();
    } else {
      setLoading(false);
    }
  }, [canAccessDashboard]);

  // 1. Auth loading
  if (authLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mb-3" />
        <h3 className="text-base font-bold text-white">Verifying Placement Credentials...</h3>
        <p className="text-xs text-slate-400 mt-0.5">Authenticating role and institutional access rights.</p>
      </div>
    );
  }

  // 2. Unauthenticated -> Login Screen
  if (!user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Placement Intelligence Login Required</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Institutional candidate evaluation dossiers, scoring breakdowns, and placement analytics are confidential. Please sign in with an authorized account.
          </p>
          <Link
            href="/login?redirect=/admin/dashboard"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            Sign In to Access Dashboard <ArrowUpRight className="w-4 h-4" />
          </Link>
          <div className="mt-5 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500">
            Placement Director / Admin: <span className="font-mono text-slate-300">admin@vantage.ai</span> (password: <span className="font-mono text-slate-300">admin123</span>)
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated but unauthorized
  if (!canAccessDashboard) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full bg-slate-900/90 border border-rose-500/30 rounded-2xl p-8 backdrop-blur-xl shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold mb-3">
            <Lock className="w-3.5 h-3.5" /> 403 &bull; Placement Access Restricted
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Not Authorized</h2>
          <p className="text-xs text-slate-300 mb-4">
            You are currently signed in as <strong className="text-white">{user.name}</strong> (<span className="text-cyan-400">{user.email}</span>). Your account does not have Placement Officer privileges.
          </p>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left text-xs text-slate-400 space-y-2 mb-6">
            <div className="font-semibold text-slate-200">How to get access:</div>
            <p>
              &bull; The Platform Administrator (<span className="font-mono text-indigo-300">admin@vantage.ai</span>) has the power to grant your account instant 1-click Placement Dashboard access.
            </p>
            <p>
              &bull; Once granted, you will be able to review candidate evaluations, technical scores, and manage curated job drives.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/student/setup"
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition text-center"
            >
              Go to Candidate Screen
            </Link>
            <button
              onClick={logout}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-rose-950/70 hover:bg-rose-900/70 text-rose-200 font-medium text-xs border border-rose-500/30 transition text-center cursor-pointer"
            >
              Switch Account (Sign Out)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Data loading
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mb-3" />
        <h3 className="text-base font-bold text-white">Aggregating Placement Intelligence...</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Synthesizing assessment data, technical caliber scores, and candidate registries.
        </p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center min-h-[60vh]">
        <p className="text-sm text-red-400 mb-3">Failed to load candidate metrics.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  // Filter candidates
  const filteredSessions = metrics.recentSessions.filter((session) => {
    const matchesSearch =
      session.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (session.candidateEmail && session.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      session.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.primaryGapArea.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBranch =
      selectedBranch === 'All' || session.branch.includes(selectedBranch);

    return matchesSearch && matchesBranch;
  });

  const chartColors = ['#f43f5e', '#fb923c', '#f59e0b', '#38bdf8', '#818cf8', '#34d399'];

  const handleExportCSV = () => {
    const headers = ['Candidate Name', 'Discipline', 'Project Title', 'Technical Score', 'Primary Gap'];
    const rows = filteredSessions.map((s) => [
      `"${s.studentName}"`,
      `"${s.branch}"`,
      `"${s.projectTitle}"`,
      s.technicalScore,
      `"${s.primaryGapArea}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vantage_candidate_evaluations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Placement Intelligence Console
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Live Database Active &bull; {metrics.totalInvited} Candidates &bull; {jobsList.length} Job Listings
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[11px] font-medium">
              Authenticated: {user?.name} ({user?.role === 'admin' ? 'Super Administrator' : 'Authorized Placement Officer'})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Placement Intelligence &amp; Job Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Real-time competency analytics, registered candidate accounts, and live placement job drive curation.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 transition"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>View Public Jobs</span>
          </Link>
          <Link
            href="/student/setup"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mock Interview</span>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Candidate Analytics &amp; Heatmap</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>User Accounts &amp; Powers ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'jobs'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Job &amp; News Manager ({jobsList.length} Jobs &bull; {newsList.length} News)</span>
        </button>
      </div>

      {/* TAB 1: ANALYTICS & ASSESSMENT ROSTER */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fadeIn">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Registered Candidates */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Registered Candidates</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{metrics.totalInvited}</span>
                <span className="text-xs text-slate-400">Total Accounts</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, (metrics.activeStudents / Math.max(metrics.totalInvited, 1)) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-emerald-400 mt-2 font-medium">
                {metrics.activeStudents} active &bull; {Math.round((metrics.activeStudents / Math.max(metrics.totalInvited, 1)) * 100)}% evaluation rate
              </p>
            </div>

            {/* Card 2: Evaluations Conducted */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Evaluations Conducted</span>
                <BarChart3 className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{metrics.totalInterviews}</span>
                <span className="text-xs text-slate-400">Total Rounds</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, (metrics.completedThreeOrMore / Math.max(metrics.activeStudents, 1)) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {metrics.completedThreeOrMore} multi-round candidate profiles
              </p>
            </div>

            {/* Card 3: Batch Avg Technical Score */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Mean Technical Caliber</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{metrics.averageTechnicalScore}</span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${metrics.averageTechnicalScore}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Benchmark based on multi-round AI rubric
              </p>
            </div>

            {/* Card 4: Primary Skill Deficit */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Top Cohort Deficit</span>
                <TrendingUp className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-rose-300 truncate">
                  {metrics.weakTopics[0]?.topic || 'System Design'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Struggled by <strong className="text-rose-400">{metrics.weakTopics[0]?.percentageStruggled || 0}%</strong> of batch
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Recommended for track workshops</p>
            </div>
          </div>

          {/* Performance Distribution & Skill Gap Heatmap */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">Cohort Skill Gap &amp; Deficit Heatmap</h3>
                <p className="text-xs text-slate-400">
                  Percentage of candidates demonstrating conceptual gaps during technical rounds.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">Cohort Deficit %</span>
            </div>

            <div className="h-64 sm:h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.weakTopics}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <XAxis type="number" domain={[0, 100]} unit="%" stroke="#64748b" fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="topic"
                    stroke="#94a3b8"
                    fontSize={11}
                    width={140}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '0.75rem',
                    }}
                    formatter={(value: any) => [`${value}% of candidates`, 'Deficit Rate']}
                  />
                  <Bar dataKey="percentageStruggled" radius={[0, 6, 6, 0]}>
                    {metrics.weakTopics.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Candidate Assessment Roster */}
          <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">Candidate Assessment Roster</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verified scores and identified improvement areas across all evaluations.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search candidate or project..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-60"
                  />
                </div>

                {/* Filter */}
                <div className="relative">
                  <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 appearance-none"
                  >
                    <option value="All">All Disciplines</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Tech</option>
                    <option value="Data Science">Data Science &amp; AI</option>
                    <option value="Electronics">Electronics</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Candidate Profile</th>
                    <th className="py-3 px-4">Discipline</th>
                    <th className="py-3 px-4">Project Evaluated</th>
                    <th className="py-3 px-4">Technical Score</th>
                    <th className="py-3 px-4">Primary Gap Area</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSessions.map((session) => (
                    <tr key={session.interviewId} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-white">{session.studentName}</span>
                            {session.targetRole && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/20">
                                {session.targetRole}
                              </span>
                            )}
                          </div>
                          {session.candidateEmail ? (
                            <span className="text-[11px] text-cyan-400 font-mono mt-0.5">
                              {session.candidateEmail}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Local candidate</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{session.branch}</td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-200 line-clamp-1 max-w-[200px]">
                          {session.projectTitle}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            session.technicalScore >= 80
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : session.technicalScore >= 60
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : session.technicalScore > 0
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {session.technicalScore > 0 ? `${session.technicalScore}/100` : 'In Progress'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
                          {session.primaryGapArea}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {session.completedAt ? session.completedAt.slice(0, 10) : 'Recently'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {session.technicalScore > 0 ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedInterviewId(session.interviewId)}
                                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold text-[11px] px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 hover:bg-cyan-900/60 transition cursor-pointer"
                                title="Quick preview evaluation dossier"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Inspect</span>
                              </button>
                              <Link
                                href={`/student/report/${session.interviewId}`}
                                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold text-[11px] px-1.5 py-1"
                                title="Open full dossier in new page"
                              >
                                <span>Dossier</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </Link>
                            </>
                          ) : (
                            <Link
                              href={`/interview/${session.interviewId}`}
                              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold text-[11px] px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 hover:bg-emerald-900/60 transition"
                              title="Continue or review live interview session"
                            >
                              <span>Resume</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER ACCOUNTS & POWERS */}
      {activeTab === 'users' && (
        <div className="animate-fadeIn">
          <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-bold text-white">Registered Candidate Accounts &amp; Access Controls</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Complete view of all registered users. Toggle placement dashboard privileges and grant unlimited mock interview passes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                    Total: <strong className="text-white">{users.length}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                    Pro Subscribed: <strong className="text-emerald-400">{users.filter((u) => u.subscription_status === 'active' || u.role === 'admin').length}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                    Dashboard Power: <strong className="text-cyan-400">{users.filter((u) => u.can_access_dashboard || u.role === 'admin').length}</strong>
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Filter by name or email..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-56"
                  />
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">User Account</th>
                    <th className="py-3 px-4">Password Credential</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Interviews Taken</th>
                    <th className="py-3 px-4">Subscription</th>
                    <th className="py-3 px-4">Dashboard Access</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users
                    .filter(
                      (u) =>
                        u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                        u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                    )
                    .map((u) => {
                      const isSuperAdmin = u.email === 'admin@vantage.ai';
                      const isPro = u.subscription_status === 'active' || u.role === 'admin';
                      const hasDashboard = Boolean(u.can_access_dashboard || u.role === 'admin');

                      return (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-white flex items-center gap-1.5">
                                {u.name}
                                {isSuperAdmin && (
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] uppercase font-bold tracking-wider">
                                    Root Admin
                                  </span>
                                )}
                              </span>
                              <span className="text-[11px] text-cyan-400 font-mono mt-0.5 flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-500" />
                                {u.email}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                {showPasswords[u.id] ? (
                                  u.plain_password || '(unencrypted default)'
                                ) : (
                                  '&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;'
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(u.id)}
                                className="text-slate-500 hover:text-slate-300 transition"
                                title={showPasswords[u.id] ? 'Hide password' : 'Show password'}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                u.role === 'admin'
                                  ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-300">
                            {u.interviews_conducted_count || 0}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isPro
                                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-950/40 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {isPro ? 'Pro / Unlimited' : 'Free Trial'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                hasDashboard
                                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30'
                                  : 'bg-slate-800/80 text-slate-500'
                              }`}
                            >
                              {hasDashboard ? 'Authorized' : 'Restricted'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            {!isSuperAdmin ? (
                              <div className="inline-flex items-center gap-1.5">
                                {/* Toggle Dashboard Power */}
                                <button
                                  type="button"
                                  onClick={() => handleUserAction(u.id, 'toggle_dashboard', !hasDashboard)}
                                  disabled={actionLoading === `${u.id}_toggle_dashboard`}
                                  className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                    hasDashboard
                                      ? 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30 hover:bg-cyan-900/50'
                                      : 'text-slate-400 bg-slate-900 border-slate-800 hover:text-white'
                                  }`}
                                  title={hasDashboard ? 'Revoke placement dashboard access' : 'Grant placement dashboard access'}
                                >
                                  {hasDashboard ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                </button>

                                {/* Grant/Revoke Pro Subscription */}
                                {!isPro ? (
                                  <button
                                    type="button"
                                    onClick={() => handleUserAction(u.id, 'grant_pro')}
                                    disabled={actionLoading === `${u.id}_grant_pro`}
                                    className="px-2 py-1 rounded-lg text-[10px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 hover:bg-emerald-900/60 transition cursor-pointer"
                                    title="Upgrade to Pro unlimited pass"
                                  >
                                    Grant Pro
                                  </button>
                                ) : (
                                  u.role !== 'admin' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUserAction(u.id, 'revoke_pro')}
                                      disabled={actionLoading === `${u.id}_revoke_pro`}
                                      className="px-2 py-1 rounded-lg text-[10px] text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900 transition cursor-pointer"
                                      title="Revoke Pro pass"
                                    >
                                      Revoke Pro
                                    </button>
                                  )
                                )}

                                {/* Reset Free Trial */}
                                {u.interviews_conducted_count > 0 && !isPro && (
                                  <button
                                    type="button"
                                    onClick={() => handleUserAction(u.id, 'reset_trial')}
                                    disabled={actionLoading === `${u.id}_reset_trial`}
                                    className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition cursor-pointer"
                                    title="Reset to 1 free interview trial"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">
                                Admin Delegated
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: JOBS & NEWS MANAGER */}
      {activeTab === 'jobs' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Sub-navigation & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setJobsSubTab('postings')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  jobsSubTab === 'postings'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Live Job Postings ({jobsList.length})</span>
              </button>

              <button
                onClick={() => setJobsSubTab('news')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  jobsSubTab === 'news'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Newspaper className="w-3.5 h-3.5" />
                <span>Hiring &amp; Campus News ({newsList.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {jobsSubTab === 'postings' ? (
                <button
                  onClick={() => setShowJobForm(!showJobForm)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showJobForm ? 'Close Job Form' : 'Post New Job Drive'}</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowNewsForm(!showNewsForm)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/20 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showNewsForm ? 'Close News Form' : 'Publish Hiring Announcement'}</span>
                </button>
              )}
            </div>
          </div>

          {/* CREATE JOB FORM */}
          {jobsSubTab === 'postings' && showJobForm && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Briefcase className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-white">Post Verified Job Drive / Opportunity</h3>
                </div>
                <span className="text-xs text-slate-400">Publicly visible on /jobs directory</span>
              </div>

              <form onSubmit={handleCreateJob} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    placeholder="e.g. Associate Software Engineer - SDE 1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={newJobCompany}
                    onChange={(e) => setNewJobCompany(e.target.value)}
                    placeholder="e.g. Swiggy, Razorpay, Google"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Role Track</label>
                  <select
                    value={newJobTrack}
                    onChange={(e) => setNewJobTrack(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="SDE">SDE / Core DSA</option>
                    <option value="Frontend">Frontend Development</option>
                    <option value="Backend">Backend Engineering</option>
                    <option value="Full-Stack">Full-Stack Development</option>
                    <option value="AI/ML">AI &amp; Machine Learning</option>
                    <option value="Data Science">Data Science &amp; Analytics</option>
                    <option value="DevOps/SRE">DevOps &amp; Cloud / SRE</option>
                    <option value="Mobile">Mobile App Engineering</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Experience Level</label>
                  <select
                    value={newJobExp}
                    onChange={(e) => setNewJobExp(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="fresher">Freshers / 2024-2026 Batch</option>
                    <option value="1-3">1 - 3 Years</option>
                    <option value="3-5">3 - 5 Years</option>
                    <option value="5+">5+ Years / Senior</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Location</label>
                  <input
                    type="text"
                    value={newJobLocation}
                    onChange={(e) => setNewJobLocation(e.target.value)}
                    placeholder="e.g. Bangalore (Hybrid) / Remote"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Salary / CTC</label>
                  <input
                    type="text"
                    value={newJobSalary}
                    onChange={(e) => setNewJobSalary(e.target.value)}
                    placeholder="e.g. ₹12 - ₹18 LPA / Competitive"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Direct Apply Link URL *</label>
                  <input
                    type="url"
                    required
                    value={newJobApplyUrl}
                    onChange={(e) => setNewJobApplyUrl(e.target.value)}
                    placeholder="https://company.com/careers/job-123"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Source Platform</label>
                  <select
                    value={newJobPlatform}
                    onChange={(e) => setNewJobPlatform(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Naukri">Naukri.com</option>
                    <option value="Indeed">Indeed</option>
                    <option value="Wellfound">Wellfound (AngelList)</option>
                    <option value="Internshala">Internshala</option>
                    <option value="Y Combinator">Y Combinator Jobs</option>
                    <option value="Google Careers">Google Careers</option>
                    <option value="Direct Careers">Company Careers Portal</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Skill Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newJobTags}
                    onChange={(e) => setNewJobTags(e.target.value)}
                    placeholder="e.g. DSA, Node.js, Distributed Systems, SQL"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="fresherCheck"
                    checked={newJobFresherEligible}
                    onChange={(e) => setNewJobFresherEligible(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="fresherCheck" className="text-slate-300 font-medium cursor-pointer">
                    Eligible for Freshers &amp; Graduating Batches (highlights with Freshers Welcome badge)
                  </label>
                </div>

                <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowJobForm(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={jobSubmitLoading}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {jobSubmitLoading ? 'Publishing...' : 'Publish Job Posting'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* CREATE NEWS FORM */}
          {jobsSubTab === 'news' && showNewsForm && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-cyan-500/30 shadow-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Newspaper className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-white">Publish Hiring Announcement / Campus Drive</h3>
                </div>
                <span className="text-xs text-slate-400">Publicly visible on /jobs feed</span>
              </div>

              <form onSubmit={handleCreateNews} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Headline *</label>
                  <input
                    type="text"
                    required
                    value={newNewsHeadline}
                    onChange={(e) => setNewNewsHeadline(e.target.value)}
                    placeholder="e.g. Swiggy kicks off 2026 Campus Hiring Drive across 50+ Engineering Colleges"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={newNewsCompany}
                    onChange={(e) => setNewNewsCompany(e.target.value)}
                    placeholder="e.g. Swiggy, TCS, Razorpay"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Announcement Tag</label>
                  <select
                    value={newNewsTag}
                    onChange={(e) => setNewNewsTag(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Hiring">Hiring Announcement</option>
                    <option value="Campus Drive">Campus Placement Drive</option>
                    <option value="Funding">Funding-Linked Hiring</option>
                    <option value="Layoff">Market Alert / Layoff</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">1-Line Summary *</label>
                  <textarea
                    required
                    rows={2}
                    value={newNewsSummary}
                    onChange={(e) => setNewNewsSummary(e.target.value)}
                    placeholder="Concise overview of open roles, qualification criteria, and application window."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Source Name</label>
                  <input
                    type="text"
                    value={newNewsSource}
                    onChange={(e) => setNewNewsSource(e.target.value)}
                    placeholder="e.g. LinkedIn, YourStory, Campus TPO Cell"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Source / Verification Link URL</label>
                  <input
                    type="url"
                    value={newNewsUrl}
                    onChange={(e) => setNewNewsUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/feed/..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="newsFreshersCheck"
                    checked={newNewsFreshersOnly}
                    onChange={(e) => setNewNewsFreshersOnly(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="newsFreshersCheck" className="text-slate-300 font-medium cursor-pointer">
                    Targeted for Freshers / College Students Only
                  </label>
                </div>

                <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewsForm(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={jobSubmitLoading}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition shadow-lg shadow-cyan-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {jobSubmitLoading ? 'Publishing...' : 'Publish Announcement'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TABLE: LIVE JOB POSTINGS */}
          {jobsSubTab === 'postings' && (
            <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Active Placement Job Postings</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Aggregated opportunities from LinkedIn, Naukri, Internshala, and admin listings.
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {jobsList.length} Active Positions
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Opportunity</th>
                      <th className="py-3 px-4">Track</th>
                      <th className="py-3 px-4">Experience &amp; Level</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Source Platform</th>
                      <th className="py-3 px-4">Direct Link</th>
                      <th className="py-3 px-4 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {jobsList.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-white flex items-center gap-1.5">
                              {job.roleTitle}
                              {job.isNewThisWeek && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] uppercase font-bold">
                                  New
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-cyan-400 font-medium">
                              {job.companyName}
                              {job.salaryOrStipend && (
                                <span className="text-emerald-400 ml-2 font-mono">
                                  &bull; {job.salaryOrStipend}
                                </span>
                              )}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/20 text-[10px] font-semibold uppercase">
                            {job.targetTrack}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-slate-300">
                            {job.experienceLevel}
                          </span>
                          {job.batchOrEligibility && (
                            <span className="block text-[10px] text-emerald-400 font-medium">
                              {job.batchOrEligibility}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-400">
                          {job.location}
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
                            {job.platform}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <a
                            href={job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium text-xs hover:underline"
                          >
                            <span>Apply</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteJob(job.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                            title="Remove job posting"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABLE: HIRING NEWS & CAMPUS DRIVES */}
          {jobsSubTab === 'news' && (
            <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Curated Hiring Announcements &amp; Campus Updates</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Funding-linked drives, campus visits, and market announcements.
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {newsList.length} News Items
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Tag</th>
                      <th className="py-3 px-4">Company &amp; Headline</th>
                      <th className="py-3 px-4">Summary</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4">Link</th>
                      <th className="py-3 px-4 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {newsList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              item.tag === 'Campus Drive'
                                ? 'bg-purple-950/80 text-purple-300 border border-purple-500/30'
                                : item.tag === 'Hiring'
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                                : item.tag === 'Funding'
                                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30'
                                : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {item.tag}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-col max-w-[280px]">
                            <span className="font-semibold text-white line-clamp-1">{item.headline}</span>
                            <span className="text-[11px] text-cyan-400 mt-0.5">{item.companyName}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-400 max-w-[320px]">
                          <span className="line-clamp-2">{item.summary}</span>
                        </td>

                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {item.source}
                        </td>

                        <td className="py-3 px-4">
                          {item.linkUrl && (
                            <a
                              href={item.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs hover:underline"
                            >
                              <span>Read</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteNews(item.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                            title="Delete announcement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Dossier Inspection Modal */}
      <CandidateDossierModal
        interviewId={selectedInterviewId}
        onClose={() => setSelectedInterviewId(null)}
      />
    </div>
  );
}
