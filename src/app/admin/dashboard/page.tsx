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
import { DepartmentMetrics, User } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { CandidateDossierModal } from '@/components/CandidateDossierModal';

export default function AdminDashboardPage() {
  const { user, loading: authLoading, canAccessDashboard, logout } = useAuth();
  const [metrics, setMetrics] = useState<DepartmentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);


  // User Accounts & Power Delegation State
  const [users, setUsers] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

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

  // 3. Authenticated but unauthorized (User lacks can_access_dashboard power)
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
              &bull; Once granted, you will be able to review candidate evaluations, technical scores, and institutional skill gap heatmaps.
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
        <h3 className="text-base font-bold text-white">Aggregating Live Candidate Intelligence...</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Synthesizing assessment data, technical depth scores, and skill gap heatmaps from registered candidates.
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
    link.setAttribute('download', `cohort_assessment_report.csv`);
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
              Live Database Active &bull; {metrics.totalInvited} Registered Candidates
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[11px] font-medium">
              Authenticated: {user?.name} ({user?.role === 'admin' ? 'Super Administrator' : 'Authorized Placement Officer'})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Candidate Evaluation &amp; Placement Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Real-time competency analytics, technical caliber scoring, and verified hiring dossiers for logged-in candidates.
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
            href="/student/setup"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Evaluation</span>
          </Link>
        </div>
      </div>

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

        {/* Card 2: Evaluations Completed */}
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
            <span className="text-sm text-slate-400">/ 10</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full"
              style={{ width: `${(metrics.averageTechnicalScore / 10) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Synthesized from criteria scorecards
          </p>
        </div>

        {/* Card 4: Batch Avg Communication Score */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Mean Communication</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{metrics.averageCommunicationScore}</span>
            <span className="text-sm text-slate-400">/ 10</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${(metrics.averageCommunicationScore / 10) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Speech pacing &amp; articulation
          </p>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-400" />
              <span>Competency Deficit Heatmap</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Identified technical gaps across the candidate cohort.
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
                          <span className="px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-500/30 text-[9px] font-mono text-cyan-300 uppercase font-bold">
                            {session.targetRole}
                          </span>
                        )}
                        {session.studentName.includes('(Super Admin)') && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold uppercase">
                            Admin Session
                          </span>
                        )}
                      </div>
                      {session.candidateEmail ? (
                        <span className="text-[11px] text-slate-400 font-mono">{session.candidateEmail}</span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Candidate Session</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {session.branch}
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                    {session.projectTitle}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {session.technicalScore > 0 ? (
                        <>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                              session.technicalScore >= 8
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : session.technicalScore >= 6
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {session.technicalScore} / 10
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Comm: {session.communicationScore}
                          </span>
                        </>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full font-medium text-[10px] bg-amber-950/70 text-amber-300 border border-amber-500/30 animate-pulse">
                          {session.status === 'in-progress' ? 'Session In-Progress' : 'Session Recorded'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 font-mono text-[10px]">
                      {session.primaryGapArea}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                    {new Date(session.completedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
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

      {/* Candidate User Accounts & Power Delegation Roster */}
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
              Complete data of all registered users. Freely grant unlimited interview subscriptions and toggle Placement Dashboard privileges.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Metrics */}
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

            {/* Search */}
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
                <th className="py-3 px-4">User Profile</th>
                <th className="py-3 px-4">DB Password / Credentials</th>
                <th className="py-3 px-4">Placement Portal Role</th>
                <th className="py-3 px-4">Interviews Taken</th>
                <th className="py-3 px-4">Subscription</th>
                <th className="py-3 px-4 text-right">Admin Delegation & Power</th>
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
                  const isPro = u.subscription_status === 'active' || u.role === 'admin';
                  const isPlacementOfficer = u.role === 'college_admin' || u.can_access_dashboard || u.role === 'admin';

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      {/* User Profile */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{u.name}</span>
                            {u.role === 'admin' && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold uppercase">
                                Super Admin
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-cyan-400 font-mono">{u.email}</span>
                        </div>
                      </td>

                      {/* Stored Password / Credentials */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-300">
                            {showPasswords[u.id] ? (u.password || 'default123') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(u.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title={showPasswords[u.id] ? 'Hide password' : 'View user password in DB'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Placement Portal Role & Power */}
                      <td className="py-3 px-4">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                            <ShieldCheck className="w-3 h-3 text-indigo-400" />
                            Platform Super Admin
                          </span>
                        ) : u.role === 'college_admin' || u.can_access_dashboard ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                            Placement Officer (Full Access)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            <Lock className="w-3 h-3 text-slate-500" />
                            Student (Candidate)
                          </span>
                        )}
                      </td>

                      {/* Interviews Taken */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-slate-200">
                          {u.interviews_conducted_count}{' '}
                          <span className="text-slate-500 text-[10px]">
                            {isPro ? '(Unlimited)' : u.interviews_conducted_count >= 1 ? '(Trial Used)' : '(1 Free Available)'}
                          </span>
                        </span>
                      </td>

                      {/* Subscription Plan */}
                      <td className="py-3 px-4">
                        {isPro ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
                            <Zap className="w-3 h-3 text-emerald-400" />
                            Pro Unlimited
                          </span>
                        ) : u.interviews_conducted_count >= 1 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-950/60 text-rose-300 border border-rose-500/30">
                            <Lock className="w-3 h-3 text-rose-400" />
                            Trial Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-950/60 text-amber-300 border border-amber-500/30">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            1 Free Trial
                          </span>
                        )}
                      </td>

                      {/* Delegation Powers */}
                      <td className="py-3 px-4 text-right">
                        {user?.role === 'admin' ? (
                          <div className="inline-flex items-center gap-1.5">
                            {/* Promote to Placement Officer / Demote */}
                            {u.role !== 'admin' && (
                              <button
                                type="button"
                                onClick={() => handleUserAction(
                                  u.id,
                                  'promote_role',
                                  undefined,
                                  u.role === 'college_admin' ? 'user' : 'college_admin'
                                )}
                                disabled={actionLoading === `${u.id}_promote_role`}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer disabled:opacity-40 ${
                                  u.role === 'college_admin' || u.can_access_dashboard
                                    ? 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-700/50'
                                    : 'bg-cyan-950/70 hover:bg-cyan-900/70 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                                }`}
                                title={
                                  u.role === 'college_admin'
                                    ? 'Demote back to standard candidate'
                                    : 'Promote this user to Placement Officer (grants full placement portal access)'
                                }
                              >
                                {u.role === 'college_admin' || u.can_access_dashboard
                                  ? 'Demote to Candidate'
                                  : '⭐ Promote to Placement Officer'}
                              </button>
                            )}

                            {/* Grant / Revoke Pro */}
                            {!isPro ? (
                              <button
                                type="button"
                                onClick={() => handleUserAction(u.id, 'grant_pro')}
                                disabled={actionLoading === `${u.id}_grant_pro`}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-500/40 transition cursor-pointer disabled:opacity-40"
                                title="Freely grant 30-day unlimited interview pass"
                              >
                                + Grant Pro
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

      {/* Quick Dossier Inspection Modal */}
      <CandidateDossierModal
        interviewId={selectedInterviewId}
        onClose={() => setSelectedInterviewId(null)}
      />
    </div>
  );
}



