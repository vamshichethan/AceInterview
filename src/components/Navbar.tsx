'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sparkles,
  Mic,
  BarChart3,
  ArrowRight,
  Shield,
  Zap,
  LogOut,
  User as UserIcon,
  BookOpen,
  Briefcase,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSubscribed, canAccessDashboard, openSubscriptionModal, logout } = useAuth();

  const isStudent = pathname.startsWith('/student');
  const isAdmin = pathname.startsWith('/admin');
  const isLearn = pathname.startsWith('/learn');
  const isJobs = pathname.startsWith('/jobs');
  const isInsideInterview = pathname.startsWith('/student/interview/');

  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingNav, setPendingNav] = useState<{ url: string; label: string } | null>(null);

  const handleInterceptedNav = (e: React.MouseEvent, url: string, label: string) => {
    if (isInsideInterview) {
      e.preventDefault();
      setPendingNav({ url, label });
      setShowExitModal(true);
    }
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    if (pendingNav) {
      if (pendingNav.url === '__logout__') {
        logout();
      } else {
        router.push(pendingNav.url);
      }
      setPendingNav(null);
    }
  };

  const homeTarget = user
    ? user.email?.toLowerCase().trim() === 'vamshicodes29@gmail.com'
      ? '/admin/dashboard'
      : '/student/setup'
    : '/';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            href={homeTarget}
            onClick={(e) => handleInterceptedNav(e, homeTarget, 'Home')}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform bg-white/5 border border-indigo-500/30 flex items-center justify-center p-0.5">
              <img src="/logo.png" alt="AceInterview.ai Logo" className="w-full h-full object-contain rounded-lg" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-lg tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                  AceInterview<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400">.ai</span>
                </span>
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Pro
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium -mt-0.5 hidden sm:block">
                Ace Every Interview.
              </span>
            </div>
          </Link>

          {/* Active Interview Room Indicator */}
          {isInsideInterview && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/40 text-xs font-semibold text-rose-300 shadow-sm shadow-rose-950/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <span>Live Interview Session</span>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/jobs"
              onClick={(e) => handleInterceptedNav(e, '/jobs', 'Jobs & News')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                isJobs
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              <span>Jobs &amp; News</span>
            </Link>

            <Link
              href="/learn"
              onClick={(e) => handleInterceptedNav(e, '/learn', 'Learning Hub')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                isLearn
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-400" />
              <span>Learning Hub</span>
            </Link>

            <Link
              href="/student/setup"
              onClick={(e) => handleInterceptedNav(e, '/student/setup', 'Interview Setup')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                isStudent
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span>Interview</span>
            </Link>

            {/* Only show Placement Dashboard strictly to Super Admin vamshicodes29@gmail.com */}
            {user && user.email?.toLowerCase().trim() === 'vamshicodes29@gmail.com' && (
              <Link
                href="/admin/dashboard"
                onClick={(e) => handleInterceptedNav(e, '/admin/dashboard', 'Placement Dashboard')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isAdmin
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Placement Dashboard</span>
              </Link>
            )}

            {/* Upgrade / Subscription button */}
            {user && !isSubscribed && (
              <button
                onClick={openSubscriptionModal}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/40 hover:bg-amber-900/60 transition-colors cursor-pointer animate-pulse"
                title="Click to upgrade for ₹99/mo"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Upgrade (₹99)</span>
              </button>
            )}

            {user && isSubscribed && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-500/30">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>Pro (Unlimited)</span>
              </span>
            )}

            {/* User Auth Info or Login Button */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white max-w-[120px] truncate">{user.name}</span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{user.email}</span>
                </div>
                <button
                  onClick={(e) => {
                    if (isInsideInterview) {
                      e.preventDefault();
                      setPendingNav({ url: '__logout__', label: 'Sign Out' });
                      setShowExitModal(true);
                    } else {
                      logout();
                    }
                  }}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
                >
                  <span>Free Trial</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Exit Confirmation Modal for Active Interview */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl shadow-rose-950/30 space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Interview Session in Progress
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                You are currently giving an active mock interview. If you navigate to{' '}
                <span className="font-semibold text-amber-300">{pendingNav?.label || 'another page'}</span>, your interview session will remain unsubmitted and the{' '}
                <span className="text-rose-300 font-semibold">countdown timer will continue running in real-time</span>.
              </p>
              <p className="text-xs text-slate-400 pt-1">
                To complete your interview and get your AI score and diagnostic feedback report, use the{' '}
                <strong className="text-white">&ldquo;End Interview&rdquo;</strong> button inside the interview room.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition"
              >
                Stay in Interview
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-700/60 border border-slate-700 text-slate-400 text-xs sm:text-sm font-semibold transition"
              >
                Leave Page
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

