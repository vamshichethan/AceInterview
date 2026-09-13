'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Mic,
  BarChart3,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Cpu,
  Brain,
  Server,
  Code2,
  CheckCircle2,
  Lock,
  FileCheck,
  Compass,
  Briefcase,
  Star,
  Award,
  ChevronRight,
  TrendingUp,
  BookOpen,
} from 'lucide-react';

export default function HomePage() {
  const { user, isSubscribed, openSubscriptionModal } = useAuth();
  const isAdmin = Boolean(user && user.email?.toLowerCase().trim() === 'vamshicodes29@gmail.com');

  return (
    <div className="flex flex-col items-center justify-center py-10 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-24">
      {/* ── HERO SECTION ── */}
      <div className="text-center max-w-4xl mx-auto space-y-7 relative">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Brand Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-semibold backdrop-blur-md shadow-lg shadow-indigo-500/10">
          <img src="/logo.png" alt="AceInterview.ai Logo" className="w-5 h-5 rounded object-cover" />
          <span className="font-bold text-white">AceInterview.ai</span>
          <span className="text-slate-400">&bull;</span>
          <span className="text-teal-300 font-medium">Ace Every Interview.</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
          Ace Every Technical Interview.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-teal-300 to-emerald-400">
            Powered by Voice AI.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          The all-in-one AI career intelligence platform. Real-time spoken technical rounds (DSA, System Design, Projects), instant ATS resume audits, and direct 1-click job application links.
        </p>

        {/* CTAs */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <>
              <Link
                href={isAdmin ? '/admin/dashboard' : '/student/setup'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600 hover:from-indigo-500 hover:via-teal-500 hover:to-emerald-500 transition-all shadow-xl shadow-indigo-600/25 hover:scale-[1.02] text-sm sm:text-base group"
              >
                <Mic className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                <span>{isAdmin ? 'Enter Placement Dashboard' : 'Launch Technical Interview'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/student/setup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold text-slate-200 bg-slate-900/90 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all text-sm sm:text-base"
              >
                <span>Candidate Workspace</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/signup?redirect=/student/setup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600 hover:from-indigo-500 hover:via-teal-500 hover:to-emerald-500 transition-all shadow-xl shadow-indigo-600/25 hover:scale-[1.02] text-sm sm:text-base group"
              >
                <Mic className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                <span>Claim 1 Free Interview (Sign Up)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/login?redirect=/student/setup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold text-slate-200 bg-slate-900/90 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all text-sm sm:text-base"
              >
                <span>Candidate Sign In</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </>
          )}
        </div>

        {user && (
          <div className="pt-2 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-medium shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Signed in as <strong className="text-white">{user.name || user.email}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Value Micro-Pills */}
        <div className="pt-5 flex flex-wrap items-center justify-center gap-6 text-slate-400 text-xs sm:text-sm font-semibold">
          <div className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>1 Free Interview on Sign Up</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">&bull;</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>₹99/mo Unlimited Pro Access</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">&bull;</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            <span>Instant In-Depth Diagnostic Report</span>
          </div>
        </div>
      </div>

      {/* ── 4-PILLAR PLATFORM OVERVIEW ── */}
      <div className="w-full space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold">
            End-to-End Pipeline
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Everything You Need to Land Top Tech Roles
          </h2>
          <p className="text-sm text-slate-400">
            From resume ATS screening to conversational interview drilling and direct job applications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Resume Rating */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/90 hover:border-teal-500/40 transition-all flex flex-col justify-between group shadow-xl">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
                Resume ATS Scorer
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated ATS audit analyzing machine readability, Google XYZ metric quantification, keyword density, and project presentation.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-semibold text-teal-400">
              Score / 100 + Bullet Rewrites &rarr;
            </div>
          </div>

          {/* Card 2: Voice Interview Engine */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/90 hover:border-indigo-500/40 transition-all flex flex-col justify-between group shadow-xl">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                Autonomous Interviewer
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Conversational voice AI that listens, questions, demands specifics on edge cases, probes trade-offs, and scores your confidence.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-semibold text-indigo-400">
              DSA, HLD, LLD &amp; Behavioral &rarr;
            </div>
          </div>

          {/* Card 3: Career Best-Fit */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/90 hover:border-cyan-500/40 transition-all flex flex-col justify-between group shadow-xl">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                Career Fit Intelligence
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Identifies which specific titles, seniority levels (0-2 YOE), and company tiers your resume and interview skills are best suited for.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-semibold text-cyan-400">
              Match % + Target Employers &rarr;
            </div>
          </div>

          {/* Card 4: 1-Click Job Apply */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/90 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-xl">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                Job Apply Launchpad
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct 1-click apply links to LinkedIn Jobs, Indeed, Wellfound, Google Careers, and Y Combinator pre-filtered for your verified stack.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-semibold text-emerald-400">
              Live Verified Requisitions &rarr;
            </div>
          </div>
        </div>
      </div>

      {/* ── LEARNING MODULE SHOWCASE ── */}
      <div className="w-full rounded-3xl bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-950 border border-indigo-500/30 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>New: Structured Engineering Curriculum</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Curated Roadmaps for Every Tech Track.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Ordered beginner-to-advanced roadmaps, verified free &amp; paid resources (Striver, NeetCode, ByteByteGo, Andrew Ng, fast.ai, roadmap.sh), quantifiable resume guides, and behavioral STAR frameworks.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-xs font-bold text-white block">SDE / Full-Stack</span>
                <span className="text-[11px] text-slate-400">DSA &amp; CS Core</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-xs font-bold text-white block">Frontend</span>
                <span className="text-[11px] text-slate-400">React &amp; Browser</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-xs font-bold text-white block">Backend</span>
                <span className="text-[11px] text-slate-400">APIs &amp; Distributed</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-xs font-bold text-white block">AI / ML &amp; DevOps</span>
                <span className="text-[11px] text-slate-400">K8s, Models &amp; CI/CD</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
            <Link
              href="/learn"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] text-center"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore Learning Module</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/student/setup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all text-center"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Take Mock Assessment</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── PRICING SECTION (Free Trial vs ₹99 Pro) ── */}
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
            Transparent Pricing
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Start Free. Upgrade to Unlimited for ₹99.
          </h2>
          <p className="text-sm text-slate-400">
            No credit card required for your first assessment. Practice without bounds when you&apos;re ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan 1: Free Trial */}
          <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
                Free Trial
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">₹0</span>
                <span className="text-xs text-slate-400 font-medium">/ 1 Full Interview</span>
              </div>
              <p className="text-xs text-slate-400">
                Ideal for testing your readiness and receiving your first comprehensive evaluation.
              </p>

              <ul className="space-y-2.5 pt-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1 Full Voice Interview Session</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Resume Quality &amp; ATS Score (/100)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Interview Skills Rating &amp; Breakdown</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Specific Improvement Action Plan</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Direct Job Application Links</span>
                </li>
              </ul>
            </div>

            {user ? (
              <Link
                href="/student/setup"
                className="mt-6 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs text-center transition-colors block"
              >
                Go to Candidate Hub
              </Link>
            ) : (
              <Link
                href="/signup"
                className="mt-6 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs text-center transition-colors block"
              >
                Get Started for Free
              </Link>
            )}
          </div>

          {/* Plan 2: AceInterview Pro (₹99/mo) */}
          <div className="p-7 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border-2 border-indigo-500/50 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-r from-indigo-500 to-teal-400 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-bl-xl">
              Most Popular
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AceInterview Pro</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">₹99</span>
                <span className="text-xs text-slate-400 font-medium">/ 30 Days Unlimited</span>
              </div>
              <p className="text-xs text-slate-400">
                Complete mastery for campus placements, lateral moves, and high-frequency practice.
              </p>

              <ul className="space-y-2.5 pt-2 text-xs text-slate-200">
                <li className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Unlimited AI Voice Interviews</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>All 8 Specialized Engineering Tracks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Multi-Project Forensic Questioning</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Printable Hiring Committee Dossiers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Priority Placement Analytics Access</span>
                </li>
              </ul>
            </div>

            {user ? (
              isSubscribed ? (
                <Link
                  href="/student/setup"
                  className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs text-center transition-all shadow-lg shadow-emerald-600/30 block"
                >
                  ✓ Pro Unlimited Active — Practice Now
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={openSubscriptionModal}
                  className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white font-bold text-xs text-center transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  Upgrade to Pro — ₹99/mo
                </button>
              )
            ) : (
              <Link
                href="/signup"
                className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white font-bold text-xs text-center transition-all shadow-lg shadow-indigo-600/30 block"
              >
                Subscribe to Pro — ₹99/mo
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── FOOTER CTA BANNER ── */}
      <div className="w-full max-w-5xl mx-auto p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-teal-950/40 border border-slate-800 text-center space-y-5 shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl mx-auto border border-indigo-500/30 p-1 bg-white/5">
          <img src="/logo.png" alt="AceInterview.ai" className="w-full h-full object-contain rounded-xl" />
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
          Ready to Ace Your Next Interview?
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Upload your resume, start your free technical screening, and receive your comprehensive candidate dossier with ratings, actionable fixes, and job links in under 15 minutes.
        </p>
        <div className="pt-2">
          <Link
            href={user ? (isAdmin ? "/admin/dashboard" : "/student/setup") : "/student/setup"}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 text-sm"
          >
            <span>{user ? (isAdmin ? "Go to Admin Dashboard" : "Launch Technical Assessment") : "Start Free Evaluation"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
