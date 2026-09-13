'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Lock,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Mic,
  Briefcase,
  BookOpen,
} from 'lucide-react';

interface SectionPaywallGuardProps {
  children: React.ReactNode;
  sectionName: string;
  sectionDescription?: string;
  icon?: 'jobs' | 'learn';
}

export function SectionPaywallGuard({
  children,
  sectionName,
  sectionDescription,
  icon = 'jobs',
}: SectionPaywallGuardProps) {
  const pathname = usePathname();
  const {
    user,
    loading,
    isSubscribed,
    isSectionTrialActive,
    trialDaysRemaining,
    hasSectionAccess,
    openSubscriptionModal,
  } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-12 text-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-xs text-slate-400">Checking subscription status...</p>
      </div>
    );
  }

  // Case 1: Unauthenticated Visitor
  if (!user) {
    return (
      <div className="space-y-8">
        {/* Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-teal-950/60 border border-indigo-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              {icon === 'jobs' ? <Briefcase className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[11px] font-semibold border border-indigo-500/20 mb-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>7-Day Free Trial Included</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Sign in to access {sectionName}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                {sectionDescription ||
                  'Create a free account or sign in to activate your 7-day complimentary access to all career modules.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link
              href={`/signup?redirect=${encodeURIComponent(pathname)}`}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition cursor-pointer"
            >
              <span>Claim 7-Day Free Trial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname)}`}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition cursor-pointer"
            >
              <span>Sign In</span>
            </Link>
          </div>
        </div>

        {/* Blurred Content Preview */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800/80">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl">
              <Lock className="w-7 h-7 text-indigo-400" />
            </div>
            <h4 className="text-lg font-bold text-white">
              7-Day Free Trial Required
            </h4>
            <p className="text-xs text-slate-400 max-w-md">
              Sign up in 30 seconds to unlock complete 7-day complimentary access to this module and 1 free technical interview assessment.
            </p>
            <Link
              href={`/signup?redirect=${encodeURIComponent(pathname)}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 transition"
            >
              <span>Get 7 Days Free Access Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="filter blur-sm pointer-events-none select-none opacity-40 max-h-[450px] overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Logged in, but 7-Day Trial has EXPIRED and NOT Subscribed
  if (!hasSectionAccess) {
    return (
      <div className="max-w-2xl mx-auto my-8 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border-2 border-indigo-500/40 shadow-2xl text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-xl">
          <Lock className="w-8 h-8 text-amber-300" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>7-Day Free Trial Expired</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Unlock 30 Days Unlimited Access
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Your 7-day complimentary trial for <strong>{sectionName}</strong> has ended.
            Upgrade to <strong>AceInterview Pro</strong> for just ₹99 to unlock 30 days of unlimited access to all sections and live voice interviews.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 text-left space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
            What You Get with ₹99 Pro (30 Days Unlimited):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Unlimited Voice AI Mock Interviews</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Full Jobs &amp; Campus News Feed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Engineering Curriculum &amp; Roadmaps</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant ATS Resume Diagnostic Audits</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={openSubscriptionModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:via-teal-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 hover:scale-[1.02] transition cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>Pay ₹99 for 30 Days Unlimited Access</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[11px] text-slate-500 mt-2.5">
            Instant activation via Official PhonePe UPI QR or Razorpay. No auto-recurring charges.
          </p>
        </div>
      </div>
    );
  }

  // Case 3: Logged in and Trial is ACTIVE (within 7 days)
  if (isSectionTrialActive && !isSubscribed) {
    return (
      <div className="space-y-6">
        {/* Trial Reminder Pill */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-teal-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              <strong className="text-emerald-300">7-Day Free Trial Active:</strong>{' '}
              {trialDaysRemaining} day{trialDaysRemaining === 1 ? '' : 's'} remaining for {sectionName}.
            </span>
          </div>

          <button
            type="button"
            onClick={openSubscriptionModal}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
            <span>Get ₹99 / 30 Days Unlimited</span>
          </button>
        </div>

        {children}
      </div>
    );
  }

  // Case 4: Logged in and Subscribed to Pro
  return (
    <div className="space-y-6">
      {/* Active Pro Badge */}
      <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 fill-emerald-400" />
            <span>Pro Unlimited Active</span>
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            30 Days Unlimited access to Interviews, Jobs &amp; Learning Hub.
          </span>
        </div>
      </div>

      {children}
    </div>
  );
}
