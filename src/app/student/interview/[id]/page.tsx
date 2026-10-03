'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Clock,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Video,
  VideoOff,
  X,
  Briefcase,
  Layers,
  Check,
  ChevronRight,
  FolderGit2,
  Cpu,
  Brain,
  Award,
  Code2,
  Terminal,
} from 'lucide-react';
import { useVoiceInterview } from '@/hooks/useVoiceInterview';
import { AudioWave } from '@/components/AudioWave';
import { HumanInterviewer } from '@/components/HumanInterviewer';
import { Interview, TARGET_ROLE_LABELS, ProjectEntry, TargetRole } from '@/lib/types';
import { InterviewIDE, SupportedLanguage } from '@/components/InterviewIDE';
import { useAuth } from '@/context/AuthContext';

// ─── Inline Webcam (auto-starts) ────────────────────────────────────────────
function CandidateCamera({ studentName, isMicActive }: { studentName: string; isMicActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [loading, setLoading] = useState(true);

  const startCamera = useCallback(async () => {
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
      setCameraError('');
    } catch (e: any) {
      console.warn('Camera access failed:', e);
      setCameraError(e?.name === 'NotAllowedError' ? 'Camera permission denied' : 'Camera unavailable');
      setCameraOn(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  // Auto-start on mount
  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);

  // The video element is only rendered after cameraOn becomes true. Attach the
  // acquired stream after that render, otherwise the live preview stays black.
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!cameraOn || !video || !stream) return;

    video.srcObject = stream;
    video.play().catch(() => {
      // Autoplay is muted and playsInline, but keep the UI usable if a browser
      // defers playback until the user interacts with the page.
    });
  }, [cameraOn]);

  return (
    <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-950 shadow-2xl w-full aspect-video">
      {cameraOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 p-4">
          {loading ? (
            <div className="w-8 h-8 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
          ) : (
            <>
              <VideoOff className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs text-slate-500 text-center">{cameraError || 'Camera off'}</p>
              <button
                onClick={startCamera}
                className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition"
              >
                Enable Camera
              </button>
            </>
          )}
        </div>
      )}

      {/* Overlay info */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2 bg-gradient-to-b from-slate-950/80 to-transparent">
        <span className="text-[10px] font-bold text-white bg-slate-950/70 px-2 py-0.5 rounded backdrop-blur-md">
          {studentName} (You)
        </span>
        <div className="flex items-center gap-1">
          {isMicActive && (
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
          )}
          <button
            onClick={cameraOn ? stopCamera : startCamera}
            className="p-1 rounded-lg bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {cameraOn ? <Video className="w-3 h-3 text-emerald-400" /> : <VideoOff className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* LIVE badge */}
      {cameraOn && (
        <div className="absolute bottom-2 left-2">
          <span className="text-[9px] font-bold text-red-300 bg-red-900/80 px-1.5 py-0.5 rounded border border-red-700/50 animate-pulse">
            ● LIVE
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main Interview Room ─────────────────────────────────────────────────────
export default function InterviewRoomPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params?.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [persona, setPersona] = useState<'alex' | 'sophia'>('alex');
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [manualInput, setManualInput] = useState('');
  const [isEnding, setIsEnding] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showResumeDrawer, setShowResumeDrawer] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'transcript' | 'ide'>('transcript');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);

  // Subscription-based Interview Duration: 30 minutes for Pro, 15 minutes for Free Trial
  const { isSubscribed, user } = useAuth();
  const isPro = Boolean(isSubscribed || user?.subscription_status === 'active' || user?.role === 'admin');
  const totalDurationSeconds = isPro ? 1800 : 900;

  // Persistent Countdown: calculates remaining seconds from real start timestamp
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (typeof window !== 'undefined' && interviewId) {
      const startKey = `interview_start_${interviewId}`;
      const stored = localStorage.getItem(startKey);
      if (stored) {
        const startTime = parseInt(stored, 10);
        if (startTime && !isNaN(startTime)) {
          const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
          return Math.max(0, (isPro ? 1800 : 900) - elapsed);
        }
      }
    }
    return totalDurationSeconds;
  });

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const {
    voiceState,
    transcript,
    setTranscript,
    currentInterimText,
    speechSupported,
    audioLevel,
    isAudioDetected,
    isMuted,
    setIsMuted,
    startListening,
    submitVoiceAnswer,
    cancelListening,
    toggleListening,
    handleStudentUtterance,
    triggerInitialQuestion,
    notifyInterviewerSpeechStart,
    notifyInterviewerSpeechEnd,
    submitCodeForReview,
  } = useVoiceInterview({
    interviewId,
    projectTitle: interview?.project_title,
    techStack: interview?.tech_stack,
    projectDescription: interview?.project_description,
    persona,
    onError: useCallback((err: string) => setErrorMessage(err), []),
  });

  // Find last AI spoken message for human subtitle display
  const lastAiMessage = [...transcript].reverse().find((m) => m.sender === 'ai')?.text || '';

  const isCodingPrompt = Boolean(
    lastAiMessage &&
    /(code|implement|function|algorithm|class|method|write a program|data structure|complexity|leetcode|two sum|reverse|binary tree|linked list|dynamic programming|array|hash map|graph|bfs|dfs|stack|queue|sql query)/i.test(lastAiMessage)
  );

  const handleIdeCodeSubmit = async (code: string, language: SupportedLanguage, output?: string) => {
    setIsSubmittingCode(true);
    try {
      await submitCodeForReview(code, language, output);
    } catch (err: any) {
      console.error('Failed to submit code for review:', err);
    } finally {
      setIsSubmittingCode(false);
    }
  };

  // Stable refs for callbacks inside initialization effect
  const triggerInitialQuestionRef = useRef(triggerInitialQuestion);
  triggerInitialQuestionRef.current = triggerInitialQuestion;

  const setTranscriptRef = useRef(setTranscript);
  setTranscriptRef.current = setTranscript;

  const initialQuestionFiredRef = useRef(false);

  // Load interview details & welcome student
  useEffect(() => {
    if (!interviewId) return;

    let isMounted = true;

    // Safety watchdog: ensure loading screen disappears within 2.5s no matter what
    const watchdog = setTimeout(() => {
      if (isMounted) setLoadingInitial(false);
    }, 2500);

    const fetchInterviewWithRetry = async (attempt = 0) => {
      // 1. Instant hydration from sessionStorage cache if available
      if (typeof window !== 'undefined') {
        try {
          const cached = sessionStorage.getItem(`interview_${interviewId}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (isMounted) {
              if (parsed.status === 'completed') {
                router.replace(`/student/report/${interviewId}`);
                return;
              }
              setInterview(parsed);
              if (parsed.interviewer_persona) setPersona(parsed.interviewer_persona);
              if (parsed.transcript && parsed.transcript.length > 0) {
                setTranscriptRef.current(parsed.transcript);
              }
              // Instant unblock!
              setLoadingInitial(false);
            }
          }
        } catch (_) {}
      }

      try {
        const res = await fetch(`/api/interview/${interviewId}`);
        if (!res.ok) {
          throw new Error(`Interview not found (${res.status})`);
        }
        const data = await res.json();
        if (!isMounted) return;

        // If interview was already completed, redirect to report!
        if (data.interview.status === 'completed') {
          router.replace(`/student/report/${interviewId}`);
          return;
        }

        setInterview(data.interview);
        setErrorMessage('');

        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(`interview_${interviewId}`, JSON.stringify(data.interview));
          } catch (_) {}

          // Anchor persistent start timestamp if not already saved
          const startKey = `interview_start_${interviewId}`;
          let startTime = localStorage.getItem(startKey);
          if (!startTime && data.interview.created_at) {
            const parsedStart = new Date(data.interview.created_at).getTime();
            if (!isNaN(parsedStart)) {
              localStorage.setItem(startKey, parsedStart.toString());
            }
          }
        }

        if (data.interview.interviewer_persona) {
          setPersona(data.interview.interviewer_persona);
        }

        if (data.interview.transcript && data.interview.transcript.length > 0) {
          setTranscriptRef.current(data.interview.transcript);
        } else if (!initialQuestionFiredRef.current) {
          initialQuestionFiredRef.current = true;
          triggerInitialQuestionRef.current(data.interview.project_title, data.interview.tech_stack);
        }
      } catch (err: any) {
        console.warn(`[interview] Attempt ${attempt + 1} failed:`, err?.message || err);
        if (attempt < 2 && isMounted) {
          const delay = (attempt + 1) * 500;
          setTimeout(() => {
            if (isMounted) fetchInterviewWithRetry(attempt + 1);
          }, delay);
        }
      } finally {
        if (isMounted) {
          setLoadingInitial(false);
        }
      }
    };

    fetchInterviewWithRetry(0);

    return () => {
      isMounted = false;
      clearTimeout(watchdog);
    };
  }, [interviewId, router]);

  // Persistent countdown timer based on real wall-clock elapsed time
  useEffect(() => {
    if (!interviewId) return;

    const tick = () => {
      const startKey = `interview_start_${interviewId}`;
      let startTime = 0;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(startKey);
        if (stored) startTime = parseInt(stored, 10);
      }
      if (!startTime && interview?.created_at) {
        startTime = new Date(interview.created_at).getTime();
        if (typeof window !== 'undefined' && !isNaN(startTime)) {
          localStorage.setItem(startKey, startTime.toString());
        }
      }

      if (startTime && !isNaN(startTime)) {
        const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        const remaining = Math.max(0, totalDurationSeconds - elapsed);
        setSecondsRemaining(remaining);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`interview_remaining_${interviewId}`, remaining.toString());
        }
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [interviewId, interview?.created_at, totalDurationSeconds]);

  // Browser navigation / tab-close guard
  useEffect(() => {
    if (interview?.status === 'completed' || isEnding) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have an interview in progress. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [interview?.status, isEnding]);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, currentInterimText]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const text = manualInput.trim();
    setManualInput('');
    handleStudentUtterance(text);
  };

  const handleEndInterview = async () => {
    if (transcript.length === 0) {
      alert('Please answer at least one question before generating your diagnostic evaluation.');
      return;
    }

    setIsEnding(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          transcript,
          projectTitle: interview?.project_title,
          techStack: interview?.tech_stack,
          durationSeconds: totalDurationSeconds - secondsRemaining,
          userId: user?.id,
        }),
      });

      if (!res.ok) throw new Error('Evaluation generation failed');
      const evalData = await res.json();
      if (evalData?.report && typeof window !== 'undefined') {
        try {
          localStorage.setItem(`ace_report_${interviewId}`, JSON.stringify(evalData.report));
        } catch (_) {}
      }
      router.push(`/student/report/${interviewId}`);
    } catch (err: any) {
      console.error('Failed to end interview:', err);
      setErrorMessage(err.message || 'Error generating feedback report.');
      setIsEnding(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="w-14 h-14 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mb-4" />
        <h3 className="text-xl font-bold text-white">Connecting to Senior Technical Interviewer...</h3>
        <p className="text-xs text-slate-400 mt-1">
          Setting up video stream, microphone pipeline, and Gemini AI interviewer persona.
        </p>
        <button
          type="button"
          onClick={() => setLoadingInitial(false)}
          className="mt-6 px-4 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20"
        >
          Enter Room Directly →
        </button>
      </div>
    );
  }

  // User Turn Count
  const userTurnCount = transcript.filter((m) => m.sender === 'user').length;

  // Parse all projects
  let parsedProjects: ProjectEntry[] = [];
  if (interview?.all_projects) {
    try {
      const parsed = JSON.parse(interview.all_projects);
      if (Array.isArray(parsed)) parsedProjects = parsed;
    } catch (_) {}
  }
  if (parsedProjects.length === 0 && interview?.project_title) {
    parsedProjects = [{
      title: interview.project_title,
      techStack: interview.tech_stack,
      description: interview.project_description || '',
    }];
  }

  const roleKey = (interview?.target_role as TargetRole) || 'sde';
  const roleLabel = TARGET_ROLE_LABELS[roleKey] || 'SDE — Software Development Engineer';

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-3 sm:px-5 lg:px-8 py-4 gap-4">
      {/* ── Session Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white">
                {interview?.project_title || 'Technical Assessment'}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {roleLabel.split('—')[0].trim()}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Candidate: <span className="text-slate-200 font-medium">{interview?.student?.name || 'Engineer'}</span> &bull;{' '}
              <span className="text-slate-400">{parsedProjects.length} {parsedProjects.length === 1 ? 'Project' : 'Projects'} in Scope</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
          <button
            type="button"
            onClick={() => setShowResumeDrawer(!showResumeDrawer)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
              showResumeDrawer
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{showResumeDrawer ? 'Close Portfolio' : `Projects (${parsedProjects.length})`}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                secondsRemaining === 0
                  ? 'bg-red-600 text-white border-red-500 animate-pulse'
                  : secondsRemaining < 180
                  ? 'bg-red-950/60 border-red-500/40 text-red-300 animate-pulse'
                  : 'bg-slate-950/80 border-slate-800 text-cyan-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{secondsRemaining === 0 ? '00:00 (Time Up)' : formatTimer(secondsRemaining)}</span>
            </div>
            <span
              className={`hidden sm:inline-flex px-2 py-0.5 rounded-md border text-[10px] font-semibold tracking-wide ${
                isPro
                  ? 'bg-indigo-950/80 border-indigo-500/40 text-indigo-300'
                  : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
              }`}
            >
              {isPro ? '⚡ Pro (30 Min)' : 'Free Trial (15 Min)'}
            </span>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
            className={`p-2 rounded-xl border text-xs transition-colors ${
              isMuted
                ? 'bg-red-950/60 border-red-800/60 text-red-300'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleEndInterview}
            disabled={isEnding || transcript.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20 transition-all disabled:opacity-40"
          >
            {isEnding ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>End Assessment</span>
              </>
            )}
          </button>
        </div>
      </div>


      {/* ── RESUME & ALL PROJECTS EXPANDABLE DRAWER ── */}
      {showResumeDrawer && (
        <div className="p-5 rounded-3xl bg-slate-900/95 border-2 border-indigo-500/50 shadow-2xl backdrop-blur-md space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Resume &amp; Project Portfolio ({parsedProjects.length} Projects in Scope)
                </h3>
                <p className="text-xs text-slate-400">
                  Target Role: <span className="text-emerald-400 font-semibold">{roleLabel}</span> • Reference while answering
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowResumeDrawer(false)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {interview?.resume_summary && (
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Candidate Summary
              </span>
              <p className="text-slate-300 leading-relaxed text-xs">{interview.resume_summary}</p>
            </div>
          )}

          {/* Grid of All Projects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
            {parsedProjects.map((proj, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{proj.title}</span>
                  {idx === 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      Primary Project
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-emerald-400">{proj.techStack}</div>
                {proj.description && (
                  <p className="text-[11px] text-slate-400 leading-relaxed">{proj.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {secondsRemaining === 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/90 via-rose-900/70 to-red-950/90 border border-red-500/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-red-100 text-xs shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-red-400 flex-shrink-0 animate-pulse" />
            <span>
              <strong>Interview Time Concluded (00:00):</strong> Your time limit has concluded. Please click <strong>End Interview</strong> to evaluate your answers and generate your AI feedback report.
            </span>
          </div>
          <button
            type="button"
            onClick={handleEndInterview}
            disabled={isEnding || transcript.length === 0}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg transition whitespace-nowrap"
          >
            {isEnding ? 'Evaluating...' : 'Submit & View Report →'}
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-900/40 border border-red-700/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="ml-auto text-red-400 hover:text-red-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Main Layout: 3-Column on large screens ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[520px]">

        {/* ── LEFT: AI Interviewer Stage (5 cols) ── */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* AI interviewer video */}
          <div className="flex-1 flex flex-col p-4 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950 border border-slate-800 shadow-2xl backdrop-blur-md relative overflow-hidden">
            <div className="flex-1 flex flex-col items-center justify-center">
              <HumanInterviewer
                persona={persona}
                state={voiceState}
                audioLevel={audioLevel}
                lastAiMessage={lastAiMessage}
                onPersonaChange={(newPersona) => setPersona(newPersona)}
                onAudioStart={notifyInterviewerSpeechStart}
                onAudioEnd={notifyInterviewerSpeechEnd}
              />
            </div>

            {/* Voice controls */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
              {/* When Candidate is speaking / Recording */}
              {voiceState === 'listening' ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                      </span>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                        Recording in Progress
                      </span>
                      <AudioWave state={voiceState} audioLevel={audioLevel} size="sm" />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={cancelListening}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700 hover:border-slate-600 shadow-md"
                        title="Discard and do not submit"
                      >
                        <X className="w-3.5 h-3.5 text-slate-400" />
                        <span>Cancel</span>
                      </button>

                      <button
                        type="button"
                        onClick={submitVoiceAnswer}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/30 transition"
                      >
                        <Send className="w-4 h-4" />
                        <span>Submit Answer</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400">
                      <span>{isAudioDetected ? '🎙️ Microphone receiving your voice' : '🎙️ Microphone active — listening'}</span>
                      <span className="text-[10px] text-emerald-300/80 font-mono">Will submit only when you press Submit Answer</span>
                    </div>

                    {currentInterimText ? (
                      <p className="text-xs text-emerald-200 italic leading-relaxed pt-1">
                        &ldquo;{currentInterimText}&rdquo;
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 pt-0.5">
                        Speak your answer clearly. Take all the time you need — nothing is submitted until you click <strong className="text-emerald-300">&ldquo;Submit Answer&rdquo;</strong>.
                      </p>
                    )}
                  </div>
                </div>
              ) : voiceState === 'speaking' ? (
                /* When Interviewer is speaking */
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30">
                    <div className="flex items-center gap-2.5">
                      <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <span className="text-xs font-semibold text-cyan-300">
                        Interviewer is speaking...
                      </span>
                      <AudioWave state={voiceState} audioLevel={audioLevel} size="sm" />
                    </div>

                    <button
                      type="button"
                      onClick={toggleListening}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold transition border border-cyan-500/40"
                    >
                      Skip / Interrupt
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 text-center">
                    Listen to the question. Once the interviewer finishes, you can take your time to think before speaking.
                  </p>
                </div>
              ) : voiceState === 'thinking' ? (
                /* When Processing response */
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30">
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
                    <span className="text-xs font-semibold text-amber-300">
                      Processing and evaluating your answer...
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-400/70 font-mono">Please wait</span>
                </div>
              ) : (
                /* When Idle / Ready — Interviewer has spoken, candidate can think and press Tap to Speak */
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      <span>Ready • Take your time to think</span>
                    </div>

                    <button
                      type="button"
                      onClick={startListening}
                      className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Tap to Speak</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 text-center sm:text-left">
                    Your mic is muted while you think. When you are ready to answer, press <strong className="text-indigo-400">&ldquo;Tap to Speak&rdquo;</strong>.
                  </p>
                </div>
              )}

              {!speechSupported && (
                <p className="text-xs text-amber-400 text-center">
                  🎙️ Voice not supported in this browser — use the text box →
                </p>
              )}
            </div>
          </div>

          {/* ── Candidate Webcam (below interviewer on left) ── */}
          <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
            <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-300">Candidate Video</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">WebRTC Active</span>
            </div>
            <CandidateCamera
              studentName={interview?.student?.name || 'Candidate'}
              isMicActive={voiceState === 'listening'}
            />
          </div>
        </div>

        {/* ── RIGHT: Live Transcript OR Interactive Code Editor (IDE) (7 cols) ── */}
        <div className="lg:col-span-7 flex flex-col rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden min-h-[640px]">
          {/* Header with Switchable Tabs */}
          <div className="p-3 sm:p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/70 flex-shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setRightPanelTab('transcript')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  rightPanelTab === 'transcript'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live Transcript</span>
                <span className="text-[10px] opacity-70 font-mono">({transcript.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setRightPanelTab('ide')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  rightPanelTab === 'ide'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Live Code Editor</span>
                {isCodingPrompt && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-400 text-slate-950 font-bold animate-pulse">
                    DSA Prompt
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                {rightPanelTab === 'ide' ? 'Integrated Sandbox' : `${transcript.length} turns`}
              </span>
              <div
                className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                  voiceState === 'listening'
                    ? 'text-emerald-300 border-emerald-700 bg-emerald-950/60'
                    : voiceState === 'speaking'
                    ? 'text-cyan-300 border-cyan-700 bg-cyan-950/60'
                    : voiceState === 'thinking'
                    ? 'text-amber-300 border-amber-700 bg-amber-950/60 animate-pulse'
                    : 'text-slate-400 border-slate-700 bg-slate-900'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    voiceState === 'listening'
                      ? 'bg-emerald-400 animate-ping'
                      : voiceState === 'speaking'
                      ? 'bg-cyan-400 animate-pulse'
                      : voiceState === 'thinking'
                      ? 'bg-amber-400'
                      : 'bg-slate-600'
                  }`}
                />
                {voiceState === 'listening'
                  ? 'Listening'
                  : voiceState === 'speaking'
                  ? 'AI Speaking'
                  : voiceState === 'thinking'
                  ? 'Processing'
                  : 'Ready'}
              </div>
            </div>
          </div>

          {/* Body: Live Code Editor (IDE) */}
          {rightPanelTab === 'ide' ? (
            <div className="flex-1 p-3.5 bg-slate-950/50 flex flex-col min-h-0 overflow-hidden">
              <InterviewIDE
                currentQuestion={lastAiMessage}
                onSubmitToInterviewer={handleIdeCodeSubmit}
                isSubmitting={isSubmittingCode}
              />
            </div>
          ) : (
            /* Body: Live Transcript + Text Input */
            <>
              <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0">
                {transcript.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-500/20 flex items-center justify-center mb-3">
                      <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
                    </div>
                    <p className="text-sm font-semibold text-white">Connecting interviewer...</p>
                    <p className="text-xs text-slate-500 mt-1">The AI interviewer is preparing your first question.</p>
                  </div>
                ) : (
                  transcript.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex gap-2.5 text-xs sm:text-sm ${
                        msg.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.sender === 'ai' && (
                        <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 text-indigo-400 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none shadow-md'
                            : 'bg-slate-800 text-slate-100 border border-slate-700/60 rounded-tl-none shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                            {msg.sender === 'user' ? (interview?.student?.name || 'You') : persona === 'sophia' ? 'Priya' : 'Aarav'}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">
                          {msg.text.startsWith('{') && msg.text.includes('"interviewerResponse"')
                            ? (msg.text.match(/"interviewerResponse"\s*:\s*"([\s\S]*?)"\s*(?:,\s*"|\}\s*$)/) || msg.text.match(/"interviewerResponse"\s*:\s*"([\s\S]*?)"/) || [])[1] || msg.text
                            : msg.text}
                        </p>
                      </div>

                      {msg.sender === 'user' && (
                        <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-emerald-400 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  ))
                )}

                {currentInterimText && (
                  <div className="flex justify-end gap-2.5">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-none p-3 text-xs bg-emerald-900/40 border border-emerald-700/40 text-emerald-300 italic animate-pulse">
                      &ldquo;{currentInterimText}&rdquo;
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-emerald-400 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}
                <div ref={transcriptEndRef} />
              </div>

              {/* Text input fallback */}
              <form
                onSubmit={handleManualSubmit}
                className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2 flex-shrink-0"
              >
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder={
                    voiceState === 'thinking'
                      ? 'Processing your answer...'
                      : voiceState === 'listening'
                      ? 'Speaking... (or type here)'
                      : 'Type your answer if microphone is unavailable...'
                  }
                  disabled={voiceState === 'thinking'}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-600 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!manualInput.trim() || voiceState === 'thinking'}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
