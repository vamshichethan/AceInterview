'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Mic, BarChart3, ArrowRight, Shield, Zap, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, isSubscribed, canAccessDashboard, openSubscriptionModal, logout } = useAuth();

  const isStudent = pathname.startsWith('/student');
  const isAdmin = pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
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

        {/* Navigation Links */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/student/setup"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              isStudent
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
            <span>Interview</span>
          </Link>


          {/* Only show Cohort Analytics if user has permission or is admin */}
          {canAccessDashboard && (
            <Link
              href="/admin/dashboard"
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
                onClick={logout}
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
  );
};

