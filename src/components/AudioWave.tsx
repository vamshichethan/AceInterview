'use client';

import React from 'react';
import { VoiceState } from '@/hooks/useVoiceInterview';

interface AudioWaveProps {
  state: VoiceState;
  audioLevel?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const AudioWave: React.FC<AudioWaveProps> = ({
  state,
  audioLevel = 0.5,
  size = 'md',
}) => {
  const bars = 16;
  const isActive = state === 'listening' || state === 'speaking';

  // Heights configuration
  const barHeights = Array.from({ length: bars }, (_, i) => {
    if (!isActive) return 8;
    const distanceCenter = Math.abs(i - bars / 2) / (bars / 2);
    const wave = Math.sin((i / bars) * Math.PI) * 0.8 + 0.2;
    const randomized = (Math.sin(Date.now() / 200 + i * 0.6) * 0.3 + 0.7);
    const heightMultiplier = Math.max(0.15, audioLevel * wave * randomized);
    return Math.max(6, Math.min(56, Math.round(heightMultiplier * (size === 'lg' ? 64 : 44))));
  });

  const getStatusLabel = () => {
    switch (state) {
      case 'listening':
        return { text: 'Listening to you...', color: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/40' };
      case 'speaking':
        return { text: 'Interviewer speaking...', color: 'text-cyan-400', badge: 'bg-cyan-500/20 border-cyan-500/40' };
      case 'thinking':
        return { text: 'Analyzing response...', color: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500/40' };
      default:
        return { text: 'Ready (Click Mic)', color: 'text-slate-400', badge: 'bg-slate-800/60 border-slate-700/60' };
    }
  };

  const status = getStatusLabel();

  return (
    <div className="flex flex-col items-center justify-center gap-3 select-none">
      {/* Visualizer bars */}
      <div className="flex items-center justify-center gap-1.5 h-16 px-4 py-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-md shadow-inner">
        {barHeights.map((h, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-full transition-all duration-75 ${
              state === 'listening'
                ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                : state === 'speaking'
                ? 'bg-gradient-to-t from-cyan-600 to-blue-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                : state === 'thinking'
                ? 'bg-gradient-to-t from-amber-600 to-yellow-400 animate-pulse'
                : 'bg-slate-700/60'
            }`}
            style={{
              height: `${h}px`,
            }}
          />
        ))}
      </div>

      {/* Pill state badge */}
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${status.badge}`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            state === 'listening'
              ? 'bg-emerald-400 animate-ping'
              : state === 'speaking'
              ? 'bg-cyan-400 animate-pulse'
              : state === 'thinking'
              ? 'bg-amber-400 animate-bounce'
              : 'bg-slate-500'
          }`}
        />
        <span className={status.color}>{status.text}</span>
      </div>
    </div>
  );
};
