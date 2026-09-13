'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, ArrowRight, Sparkles, Loader2, ShieldAlert, KeyRound, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/student/setup';

  const { login, sendOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // View mode: 'login' (email + password) | 'forgot_password' (reset via OTP)
  const [mode, setMode] = useState<'login' | 'forgot_password'>('login');
  
  // Forgot password sub-steps: 'enter_email' | 'enter_otp_new_password'
  const [forgotStep, setForgotStep] = useState<'enter_email' | 'enter_otp_new_password'>('enter_email');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── 1. Standard Login with Email and Password ────────────────────────────
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);
    setLoading(true);

    const res = await login(email.trim(), password);
    setLoading(false);

    if (res.success) {
      if (res.user?.role === 'admin' || res.user?.can_access_dashboard) {
        router.push(redirectUrl === '/student/setup' ? '/admin/dashboard' : redirectUrl);
      } else {
        router.push(redirectUrl);
      }
    } else {
      setError(res.error || 'Invalid email or password. If you do not have an account, please sign up.');
    }
  };

  // ── 2. Request Password Reset OTP ─────────────────────────────────────────
  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter your registered email address.');
      return;
    }
    setError(null);
    setStatusMessage(null);
    setLoading(true);

    const res = await sendOtp(email.trim(), 'forgot_password');
    setLoading(false);

    if (res.success) {
      setForgotStep('enter_otp_new_password');
      setStatusMessage(res.message || `A 6-digit password reset code has been sent to ${email}`);
    } else {
      setError(res.error || 'Failed to send reset code. Please verify your email.');
    }
  };

  // ── 3. Submit Reset OTP & New Password ────────────────────────────────────
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp || resetOtp.trim().length < 6) {
      setError('Please enter the 6-digit verification code from your email.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setError(null);
    setStatusMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: resetOtp.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Failed to reset password. Please check your OTP.');
        return;
      }

      setStatusMessage('🎉 Password reset successfully! Redirecting...');
      setTimeout(() => {
        if (data.user?.role === 'admin' || data.user?.can_access_dashboard) {
          router.push(redirectUrl === '/student/setup' ? '/admin/dashboard' : redirectUrl);
        } else {
          router.push(redirectUrl);
        }
      }, 1000);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Network error resetting password.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-xl shadow-indigo-500/20 mb-4 border border-indigo-500/30 p-1 bg-white/5">
            <img src="/logo.png" alt="AceInterview.ai" className="w-full h-full object-contain rounded-xl" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Candidate & Placement Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'Sign In to AceInterview.ai' : 'Reset Your Password'}
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            {mode === 'login'
              ? 'Enter your credentials to access your interview session or placement dashboard.'
              : 'Enter your registered email to receive a 6-digit password reset code.'}
          </p>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {statusMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="flex-1">{statusMessage}</span>
            </div>
          )}

          {/* ── MODE 1: Standard Password Login ── */}
          {mode === 'login' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setForgotStep('enter_email');
                      setError(null);
                      setStatusMessage(null);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── MODE 2: Forgot Password Reset Flow ── */}
          {mode === 'forgot_password' && (
            <div>
              {forgotStep === 'enter_email' ? (
                <form onSubmit={handleSendResetOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Your Registered Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      We will check our database and dispatch a 6-digit security code to your email inbox.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Reset Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Password Reset Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError(null);
                        setStatusMessage(null);
                      }}
                      className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 transition"
                    >
                      <ArrowLeft className="w-3 h-3" /> Back to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Enter 6-Digit Code from Email
                      </label>
                      <button
                        type="button"
                        onClick={() => setForgotStep('enter_email')}
                        className="text-[11px] text-indigo-400 hover:underline"
                      >
                        Change Email ({email})
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        autoFocus
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 842194"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border-2 border-indigo-500/50 text-white font-mono text-center text-lg tracking-widest placeholder-slate-600 focus:outline-none focus:border-indigo-400 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      New Password (min. 6 characters)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || resetOtp.length < 6 || newPassword.length < 6}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Update Password & Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                    <button
                      type="button"
                      onClick={handleSendResetOtp}
                      disabled={loading}
                      className="hover:text-indigo-300 flex items-center gap-1 transition"
                    >
                      <RefreshCw className="w-3 h-3" /> Resend Code
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError(null);
                        setStatusMessage(null);
                      }}
                      className="hover:text-slate-200 transition underline"
                    >
                      Cancel & Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Switch to Signup */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-indigo-400 font-semibold hover:text-indigo-300 transition underline"
            >
              Sign up with 1 Free Technical Assessment &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    }>
      <LoginForm />
    </React.Suspense>
  );
}
