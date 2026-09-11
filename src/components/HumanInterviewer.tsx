'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { VoiceState } from '@/hooks/useVoiceInterview';
import {
  Volume2,
  VolumeX,
  Mic,
  Sparkles,
  UserCheck,
  Activity,
  Wifi,
  Radio,
  Sliders,
} from 'lucide-react';

interface HumanInterviewerProps {
  state: VoiceState;
  persona?: 'alex' | 'sophia';
  audioLevel?: number;
  lastAiMessage?: string;
  onPersonaChange?: (persona: 'alex' | 'sophia') => void;
  onVideoEnd?: () => void;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
}

export const HumanInterviewer: React.FC<HumanInterviewerProps> = ({
  state,
  persona = 'alex',
  audioLevel = 0.4,
  lastAiMessage = '',
  onPersonaChange,
  onVideoEnd,
  onAudioStart,
  onAudioEnd,
}) => {
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isThinking = state === 'thinking';

  // ElevenLabs TTS Audio Playback State
  const [isSpeakingAudio, setIsSpeakingAudio] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastRenderedTextRef = useRef<string>('');

  // Elapsed interview recording timer
  const [sessionSeconds, setSessionSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Ensure clean subtitle and speech text (never raw JSON or unescaped tokens)
  const cleanSubtitleText = React.useMemo(() => {
    if (!lastAiMessage) return '';
    const trimmed = lastAiMessage.trim();
    if (trimmed.startsWith('{') && (trimmed.includes('"interviewerResponse"') || trimmed.includes('"response"'))) {
      const match =
        trimmed.match(/"interviewerResponse"\s*:\s*"([\s\S]*?)"\s*(?:,\s*"|\}\s*$)/) ||
        trimmed.match(/"interviewerResponse"\s*:\s*"([\s\S]*?)"/) ||
        trimmed.match(/"response"\s*:\s*"([\s\S]*?)"/);
      if (match && match[1]) {
        return match[1].replace(/\\"/g, '"').replace(/\\n/g, ' ').replace(/\\\\/g, '\\').trim();
      }
    }
    return trimmed.replace(/^"|"$/g, '').trim();
  }, [lastAiMessage]);

  // ElevenLabs High-Quality Speech Playback
  useEffect(() => {
    if (!cleanSubtitleText || cleanSubtitleText.trim().length === 0) return;
    if (lastRenderedTextRef.current === cleanSubtitleText) return;
    lastRenderedTextRef.current = cleanSubtitleText;

    let cancelled = false;

    const speakInterviewerVoice = async () => {
      // Stop any active audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      onAudioStart?.();

      try {
        const res = await fetch('/api/interviewer/talk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanSubtitleText, persona }),
        });

        const data = await res.json();
        if (cancelled) return;

        if (data.success && data.audioBase64) {
          const byteCharacters = atob(data.audioBase64);
          const byteNumbers = new Uint8Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const blob = new Blob([byteNumbers], { type: data.mimeType || 'audio/mpeg' });
          const url = URL.createObjectURL(blob);

          const audio = new Audio(url);
          audio.muted = isMuted;
          audio.playbackRate = 1.25; // Brisk, crisp human conversational Indian English tempo
          audioRef.current = audio;
          setIsSpeakingAudio(true);

          audio.onended = () => {
            setIsSpeakingAudio(false);
            URL.revokeObjectURL(url);
            onAudioEnd?.();
            onVideoEnd?.();
          };

          audio.onerror = () => {
            setIsSpeakingAudio(false);
            onAudioEnd?.();
          };

          await audio.play().catch((e) => {
            console.warn('[Interviewer Voice] Autoplay blocked, falling back to browser voice:', e);
            fallbackBrowserTTS(cleanSubtitleText);
          });
        } else {
          fallbackBrowserTTS(cleanSubtitleText);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[Interviewer Voice] Fetch failed, fallback to browser voice:', err);
          fallbackBrowserTTS(cleanSubtitleText);
        }
      }
    };

    const fallbackBrowserTTS = (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        onAudioEnd?.();
        return;
      }

      const clean = text
        .replace(/```[a-zA-Z]*\n([\s\S]*?)\n```/g, ' as shown in the code editor ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*#_~>]/g, '')
        .trim();

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.18; // Crisp, brisk Indian conversational speed
      utterance.pitch = 1.0;
      utterance.lang = 'en-IN';
      utterance.volume = isMuted ? 0 : 1;

      const voices = window.speechSynthesis.getVoices();
      // Prioritize authentic Indian English voices (en-IN)
      const preferred =
        voices.find(
          (v) =>
            v.lang === 'en-IN' &&
            (v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Neural'))
        ) ||
        voices.find((v) => v.lang === 'en-IN' || v.lang === 'en_IN') ||
        voices.find(
          (v) =>
            v.name.toLowerCase().includes('india') && v.name.toLowerCase().includes('google')
        ) ||
        voices.find(
          (v) =>
            v.name.includes('Rishi') ||
            v.name.includes('Veena') ||
            v.name.includes('Kavya') ||
            v.name.includes('Heera')
        ) ||
        voices.find((v) => v.lang.startsWith('en'));

      if (preferred) {
        utterance.voice = preferred;
        utterance.lang = preferred.lang || 'en-IN';
      }

      utterance.onend = () => {
        setIsSpeakingAudio(false);
        onAudioEnd?.();
        onVideoEnd?.();
      };
      utterance.onerror = () => {
        setIsSpeakingAudio(false);
        onAudioEnd?.();
      };

      setIsSpeakingAudio(true);
      window.speechSynthesis.speak(utterance);
    };

    speakInterviewerVoice();

    return () => {
      cancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [cleanSubtitleText, persona, isMuted, onAudioStart, onAudioEnd, onVideoEnd]);

  // Toggle mute
  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.muted = next;
      }
      return next;
    });
  };

  const interviewerDetails = {
    alex: {
      name: 'Aarav Sharma',
      role: 'Lead Infrastructure Architect',
      company: 'Ex-Google / Stripe',
      image: '/images/interviewer_alex.jpg',
      themeColor: 'cyan',
    },
    sophia: {
      name: 'Priya Patel',
      role: 'Principal Distributed Architect',
      company: 'Ex-AWS / Swiggy',
      image: '/images/interviewer_sophia.jpg',
      themeColor: 'indigo',
    },
  }[persona];

  const activeSpeaking = isSpeakingAudio || isSpeaking;

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* ── Studio Video Container ── */}
      <div
        className={`relative w-full aspect-[4/3] sm:aspect-[16/11] max-w-lg rounded-3xl overflow-hidden border-2 bg-slate-950 shadow-2xl transition-all duration-500 ${
          activeSpeaking
            ? 'border-cyan-500/60 shadow-cyan-500/20 ring-2 ring-cyan-500/20'
            : isListening
            ? 'border-emerald-500/50 shadow-emerald-500/15 ring-2 ring-emerald-500/20'
            : isThinking
            ? 'border-purple-500/50 shadow-purple-500/15 ring-2 ring-purple-500/20'
            : 'border-slate-800'
        }`}
      >
        {/* ── High-Fidelity Studio Portrait Feed with Natural Subtle Camera Drift ── */}
        <div
          className="relative w-full h-full overflow-hidden transition-transform duration-1000 ease-out"
          style={{
            transform: activeSpeaking
              ? 'scale(1.02) translateY(-2px)'
              : isListening
              ? 'scale(1.01) translateY(1px)'
              : 'scale(1.0)',
          }}
        >
          <Image
            src={interviewerDetails.image}
            alt={interviewerDetails.name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 512px"
            className="object-cover object-center pointer-events-none transition-all duration-700"
          />

          {/* Cinematic Studio Lighting Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/40 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/80 pointer-events-none" />

          {/* Active Speaking Ambient Studio Glow */}
          {activeSpeaking && (
            <div className="absolute inset-0 pointer-events-none bg-radial from-cyan-500/10 via-transparent to-transparent animate-pulse" />
          )}
        </div>

        {/* ── Top Meeting HUD: Clean Name Badge & State ── */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 gap-2">
          {/* Clean Interviewer Identity Badge - Just Name */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800/80 shadow-md">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  activeSpeaking
                    ? 'bg-cyan-400'
                    : isListening
                    ? 'bg-emerald-400'
                    : isThinking
                    ? 'bg-purple-400'
                    : 'bg-emerald-500'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  activeSpeaking
                    ? 'bg-cyan-400'
                    : isListening
                    ? 'bg-emerald-400'
                    : isThinking
                    ? 'bg-purple-400'
                    : 'bg-emerald-500'
                }`}
              />
            </span>
            <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
              {interviewerDetails.name}
            </span>
          </div>

          {/* State Pill Indicator */}
          {activeSpeaking ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/90 backdrop-blur-md border border-cyan-700 text-cyan-300 text-[10px] font-mono font-bold shadow-md">
              <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>SPEAKING</span>
            </div>
          ) : isListening ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/90 backdrop-blur-md border border-emerald-700 text-emerald-300 text-[10px] font-mono font-bold shadow-md">
              <Mic className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>LISTENING</span>
            </div>
          ) : isThinking ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/90 backdrop-blur-md border border-purple-700 text-purple-300 text-[10px] font-mono font-bold shadow-md">
              <Sparkles className="w-3 h-3 text-purple-400 animate-spin" />
              <span>ANALYZING...</span>
            </div>
          ) : null}
        </div>

        {/* ── Bottom Closed Captions / Question Box (Full problem statement and test case) ── */}
        {cleanSubtitleText && (
          <div className="absolute bottom-3 inset-x-3 z-20 pointer-events-none">
            <div className="p-3.5 rounded-2xl bg-slate-950/95 backdrop-blur-lg border border-slate-800/90 shadow-2xl transition-all pointer-events-auto">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <Volume2 className="w-3 h-3 text-cyan-400" />
                  <span className="text-white">{interviewerDetails.name}</span>
                  <span className="text-slate-500">• Question</span>
                </div>
                {activeSpeaking && (
                  <span className="text-[10px] font-mono text-cyan-400 animate-pulse font-medium">
                    Audio Active
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-[13px] text-slate-200 max-h-32 overflow-y-auto leading-relaxed font-normal antialiased whitespace-pre-wrap">
                &ldquo;{cleanSubtitleText}&rdquo;
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

