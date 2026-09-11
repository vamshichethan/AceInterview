'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { SubscriptionModal } from '@/components/SubscriptionModal';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <SubscriptionModal />
    </AuthProvider>
  );
}
