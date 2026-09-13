'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, User as UserIcon, ArrowRight, Sparkles, Loader2, ShieldCheck, KeyRound, CheckCircle2, RefreshCw } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { user, sendOtp, verifyOtp, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'enter_info' | 'enter_otp'>('enter_info');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, automatically redirect to workspace
  useEffect(() => {
    if (!authLoading && user) {
      const destination =
        user.role === 'admin' || user.email?.toLowerCase().trim() === 'vamshicodes29@gmail.com'
          ? '/admin/dashboard'
          : '/student/setup';
      router.replace(destination);
    }
  }, [user, authLoading, router]);

  const handleSendSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const res = await sendOtp(email, 'signup');
    setLoading(false);

    if (res.success) {
      setStep('enter_otp');
      setStatusMessage(res.message || `Verification code sent to ${email}`);
    } else {
      setError(res.error || 'Failed to send verification code.');
    }
  };

  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    const res = await verifyOtp({
      name: name.trim(),
      email: email.trim(),
      password,
      otp: otp.trim(),
    });
    setLoading(false);

    if (res.success) {
      router.push('/student/setup');
    } else {
      setError(res.error || 'Invalid or expired verification code.');
    }
  };

  if (user) {
    const destination =
      user.role === 'admin' || user.email?.toLowerCase().trim() === 'vamshicodes29@gmail.com'
        ? '/admin/dashboard'
        : '/student/setup';

    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Already Registered &amp; Signed In</h3>
            <p className="text-xs text-slate-400 mt-1">
              You are signed in as <strong className="text-indigo-300">{user.name || user.email}</strong> ({user.email}).
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => router.replace(destination)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              Continue to {user.role === 'admin' || user.email?.toLowerCase().trim() === 'vamshicodes29@gmail.com' ? 'Placement Dashboard' : 'Interview Hub'} &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-xl shadow-indigo-500/20 mb-4 border border-indigo-500/30 p-1 bg-white/5">
            <img src="/logo.png" alt="AceInterview.ai" className="w-full h-full object-contain rounded-xl" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>1 Free Technical Assessment Trial Included</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Create Your AceInterview<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400">.ai</span> Account
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-2">
            Verified candidate registration with instant AI assessment access.
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-cyan-950/20">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          {statusMessage && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="flex-1">{statusMessage}</span>
            </div>
          )}

          {step === 'enter_info' ? (
            <form onSubmit={handleSendSignupOtp} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Maya Chen"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="candidate@vantage.ai"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">We will send a 6-digit verification code to confirm ownership.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">Password</label>
                  <span className="text-[11px] text-slate-400">Min 6 characters</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Verification Code...
                  </>
                ) : (
                  <>
                    Send Verification Code <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifySignupOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">Enter 6-Digit Code</label>
                  <button
                    type="button"
                    onClick={() => setStep('enter_info')}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    Change Email ({email})
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 123456"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border-2 border-cyan-500/50 text-white font-mono text-center text-lg tracking-widest placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying & Activating Account...
                  </>
                ) : (
                  <>
                    Verify & Start Free Technical Assessment <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleSendSignupOtp}
                  disabled={loading}
                  className="text-xs text-slate-400 hover:text-cyan-300 transition flex items-center justify-center gap-1 mx-auto"
                >
                  <RefreshCw className="w-3 h-3" /> Resend Verification Code
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium underline">
              Sign In &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
