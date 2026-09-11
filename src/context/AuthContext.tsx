'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/lib/types';

type SafeUser = Omit<User, 'password'>;

interface InterviewAccess {
  allowed: boolean;
  reason?: 'FREE_TRIAL_AVAILABLE' | 'ACTIVE_SUBSCRIPTION' | 'ADMIN_BYPASS' | 'PAYWALL_REQUIRED';
}

interface AuthContextType {
  user: SafeUser | null;
  loading: boolean;
  interviewAccess: InterviewAccess | null;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string; user?: SafeUser }>;
  signup: (name: string, email: string, password?: string) => Promise<{ success: boolean; error?: string; user?: SafeUser }>;
  sendOtp: (email: string, purpose?: 'login' | 'signup' | 'forgot_password' | 'reset_password') => Promise<{ success: boolean; error?: string; demoOtp?: string; message?: string }>;
  verifyOtp: (payload: { email: string; otp: string; name?: string; password?: string; role?: string }) => Promise<{ success: boolean; error?: string; user?: SafeUser }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isSubscriptionModalOpen: boolean;
  openSubscriptionModal: () => void;
  closeSubscriptionModal: () => void;
  isSubscribed: boolean;
  canAccessDashboard: boolean;
  hasUsedFreeTrial: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [interviewAccess, setInterviewAccess] = useState<InterviewAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
        setInterviewAccess(data.interviewAccess || null);
      } else {
        setUser(null);
        setInterviewAccess(null);
      }
    } catch {
      setUser(null);
      setInterviewAccess(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const sendOtp = async (email: string, purpose: 'login' | 'signup' | 'forgot_password' | 'reset_password' = 'login') => {
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to send OTP code' };
      }
      return { success: true, demoOtp: data.demoOtp, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error sending OTP' };
    }
  };

  const verifyOtp = async (payload: { email: string; otp: string; name?: string; password?: string; role?: string }) => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid or expired OTP' };
      }
      setUser(data.user);
      await refreshUser();
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error verifying OTP' };
    }
  };

  const login = async (email: string, password?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to sign in' };
      }
      setUser(data.user);
      await refreshUser();
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const signup = async (name: string, email: string, password?: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to register' };
      }
      setUser(data.user);
      await refreshUser();
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setUser(null);
      setInterviewAccess(null);
      window.location.href = '/login';
    }
  };

  const isSubscribed = user?.subscription_status === 'active' || user?.role === 'admin';
  const canAccessDashboard = Boolean(user?.can_access_dashboard || user?.role === 'admin');
  const hasUsedFreeTrial = (user?.interviews_conducted_count ?? 0) >= 1 && !isSubscribed;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        interviewAccess,
        login,
        signup,
        sendOtp,
        verifyOtp,
        logout,
        refreshUser,
        isSubscriptionModalOpen,
        openSubscriptionModal: () => setIsSubscriptionModalOpen(true),
        closeSubscriptionModal: () => setIsSubscriptionModalOpen(false),
        isSubscribed,
        canAccessDashboard,
        hasUsedFreeTrial,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
