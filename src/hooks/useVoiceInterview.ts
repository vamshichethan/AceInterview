'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '@/lib/types';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface UseVoiceInterviewOptions {
  interviewId?: string;
  projectTitle?: string;
  techStack?: string;
  projectDescription?: string;
  onAiResponse?: (response: string) => void;
  onUserMessage?: (message: string) => void;
  onError?: (error: string) => void;
  useExternalTTS?: boolean;
  persona?: 'alex' | 'sophia';
}

interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
  __voiceUtterance?: SpeechSynthesisUtterance | null;
}

export function useVoiceInterview({
  interviewId,
  projectTitle,
  techStack,
  projectDescription,
  onAiResponse,
  onUserMessage,
  onError,
  useExternalTTS = true,
  persona = 'alex',
}: UseVoiceInterviewOptions) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<ChatMessage[]>([]);
  const [currentInterimText, setCurrentInterimText] = useState<string>('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Stabilize all callbacks and options with refs to prevent cascading re-renders
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const onAiResponseRef = useRef(onAiResponse);
  onAiResponseRef.current = onAiResponse;

  const onUserMessageRef = useRef(onUserMessage);
  onUserMessageRef.current = onUserMessage;

  const projectTitleRef = useRef(projectTitle);
  projectTitleRef.current = projectTitle;

  const techStackRef = useRef(techStack);
  techStackRef.current = techStack;

  const projectDescRef = useRef(projectDescription);
  projectDescRef.current = projectDescription;

  const interviewIdRef = useRef(interviewId);
  interviewIdRef.current = interviewId;

  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const isListeningRef = useRef<boolean>(false);
  const isThinkingRef = useRef<boolean>(false);
  const transcriptRef = useRef<ChatMessage[]>([]);
  const isMutedRef = useRef<boolean>(false);
  const networkRetryCountRef = useRef<number>(0);

  // Buffer for continuous student speech
  const accumulatedSpeechRef = useRef<string>('');
  const silenceTimerRef = useRef<any>(null);

  // Watchdog & Safety Timers for TTS (Chrome anti-freeze)
  const speechWatchdogRef = useRef<any>(null);
  const speechSafetyTimeoutRef = useRef<any>(null);
  const audioAnimationRef = useRef<number | null>(null);

  // AudioContext for real mic meter
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Keep refs in sync
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Clean up all audio/speech timers
  const clearSpeechTimers = () => {
    if (speechWatchdogRef.current) {
      clearInterval(speechWatchdogRef.current);
      speechWatchdogRef.current = null;
    }
    if (speechSafetyTimeoutRef.current) {
      clearTimeout(speechSafetyTimeoutRef.current);
      speechSafetyTimeoutRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  // MediaRecorder for capturing raw audio fallback
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const restartTimeoutRef = useRef<any>(null);
  const isAudioDetectedRef = useRef<boolean>(false);
  const [isAudioDetected, setIsAudioDetected] = useState<boolean>(false);

  // Audio visualizer loop
  const startAudioMeter = () => {
    if (audioAnimationRef.current) return;

    let soundDetectedFrames = 0;

    const updateMeter = () => {
      if (analyserRef.current && isListeningRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.fftSize);
        analyserRef.current.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const val = (dataArray[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const normalized = Math.min(1, Math.max(0.05, rms * 4));
        setAudioLevel(normalized);

        // Detect if user is actually making sound into microphone
        if (rms > 0.03) {
          soundDetectedFrames++;
          if (soundDetectedFrames > 5 && !isAudioDetectedRef.current) {
            isAudioDetectedRef.current = true;
            setIsAudioDetected(true);
          }
        }
      } else if (isSpeakingRef.current) {
        const base = Math.sin(Date.now() / 140) * 0.35 + 0.55;
        const jitter = Math.random() * 0.25;
        setAudioLevel(Math.min(1, Math.max(0.15, base + jitter)));
      } else {
        setAudioLevel(0);
      }
      audioAnimationRef.current = requestAnimationFrame(updateMeter);
    };

    audioAnimationRef.current = requestAnimationFrame(updateMeter);
  };

  const stopAudioMeter = () => {
    if (audioAnimationRef.current) {
      cancelAnimationFrame(audioAnimationRef.current);
      audioAnimationRef.current = null;
    }
    setAudioLevel(0);
    isAudioDetectedRef.current = false;
    setIsAudioDetected(false);
  };

  // Helper to pick best natural Indian English voice (Male for Aarav, Female for Priya)
  const getPreferredVoice = (): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const isMaleAarav = persona === 'alex';

    if (isMaleAarav) {
      // Prioritize male Indian English voices
      return (
        voices.find(
          (v) =>
            (v.lang === 'en-IN' || v.lang === 'en_IN') &&
            (v.name.includes('Rishi') ||
              v.name.includes('Prabhat') ||
              v.name.toLowerCase().includes('male') ||
              v.name.includes('Standard-B') ||
              v.name.includes('Wavenet-B') ||
              v.name.includes('Standard-C'))
        ) ||
        voices.find((v) => v.name.includes('Rishi') || v.name.includes('Prabhat')) ||
        voices.find(
          (v) =>
            (v.lang === 'en-IN' || v.lang === 'en_IN') &&
            !v.name.includes('Veena') &&
            !v.name.includes('Kavya') &&
            !v.name.includes('Heera') &&
            !v.name.includes('Neerja') &&
            !v.name.toLowerCase().includes('female')
        ) ||
        voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.toLowerCase().includes('male') ||
              v.name.includes('David') ||
              v.name.includes('Daniel') ||
              v.name.includes('Guy'))
        ) ||
        voices[0] ||
        null
      );
    } else {
      // Prioritize female Indian English voices
      return (
        voices.find(
          (v) =>
            (v.lang === 'en-IN' || v.lang === 'en_IN') &&
            (v.name.includes('Veena') ||
              v.name.includes('Kavya') ||
              v.name.includes('Heera') ||
              v.name.includes('Neerja') ||
              v.name.toLowerCase().includes('female') ||
              v.name.includes('Standard-A') ||
              v.name.includes('Wavenet-A') ||
              v.name.includes('Standard-D'))
        ) ||
        voices.find(
          (v) =>
            v.name.includes('Veena') ||
            v.name.includes('Kavya') ||
            v.name.includes('Neerja') ||
            v.name.includes('Heera')
        ) ||
        voices.find(
          (v) =>
            (v.lang === 'en-IN' || v.lang === 'en_IN') &&
            !v.name.includes('Rishi') &&
            !v.name.includes('Prabhat')
        ) ||
        voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.toLowerCase().includes('female') ||
              v.name.includes('Zira') ||
              v.name.includes('Samantha') ||
              v.name.includes('Jenny'))
        ) ||
        voices[0] ||
        null
      );
    }
  };

  // ── Speech Synthesis: Rock-solid, Anti-Stuck ─────────────────────────────
  const speakText = useCallback(
    (text: string, onDone?: () => void) => {
      clearSpeechTimers();

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        isSpeakingRef.current = false;
        setVoiceState('idle');
        onDone?.();
        return;
      }

      if (typeof window === 'undefined' || !window.speechSynthesis || isMutedRef.current) {
        isSpeakingRef.current = false;
        setVoiceState('idle');
        onDone?.();
        return;
      }

      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (_) {}

      const sentences = text.match(/[^.!?\n]+(?:[.!?\n]+|$)/g)?.map((s) => s.trim()).filter(Boolean) || [text];

      let currentIndex = 0;
      isSpeakingRef.current = true;
      setVoiceState('speaking');
      startAudioMeter();

      speechWatchdogRef.current = setInterval(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }
      }, 5000);

      const maxSpeechMs = Math.max(7000, text.length * 110);
      speechSafetyTimeoutRef.current = setTimeout(() => {
        finishSpeaking();
      }, maxSpeechMs);

      const finishSpeaking = () => {
        clearSpeechTimers();
        isSpeakingRef.current = false;
        stopAudioMeter();
        setVoiceState('idle');
        const win = window as unknown as IWindow;
        win.__voiceUtterance = null;
        try {
          window.speechSynthesis.cancel();
        } catch (_) {}
        onDone?.();

        setTimeout(() => {
          if (!isListeningRef.current && !isThinkingRef.current) {
            startListeningInternal();
          }
        }, 300);
      };

      const speakNextChunk = () => {
        if (currentIndex >= sentences.length || !isSpeakingRef.current) {
          finishSpeaking();
          return;
        }

        const chunkText = sentences[currentIndex];
        currentIndex++;

        const isMaleAarav = persona === 'alex';
        const utterance = new SpeechSynthesisUtterance(chunkText);
        // Aarav (Male Indian): pitch 0.88; Priya (Female Indian): pitch 1.18
        utterance.rate = isMaleAarav ? 1.15 : 1.18;
        utterance.pitch = isMaleAarav ? 0.88 : 1.18;
        utterance.lang = 'en-IN';

        const voice = getPreferredVoice();
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang || 'en-IN';
        }

        const win = window as unknown as IWindow;
        win.__voiceUtterance = utterance;

        utterance.onend = () => {
          speakNextChunk();
        };

        utterance.onerror = (e) => {
          if (e.error === 'interrupted' || e.error === 'canceled') {
            clearSpeechTimers();
            isSpeakingRef.current = false;
            stopAudioMeter();
            setVoiceState('idle');
            return;
          }
          speakNextChunk();
        };

        try {
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          finishSpeaking();
        }
      };

      speakNextChunk();
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Pre-acquire microphone & setup AudioContext meter ───────────────────
  const ensureMicrophoneStream = async (): Promise<MediaStream | null> => {
    if (micStreamRef.current && micStreamRef.current.active) {
      return micStreamRef.current;
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyserRef.current = analyser;
        }
      } catch (e) {
        console.warn('AudioContext setup skipped:', e);
      }
      return stream;
    } catch (e: any) {
      console.warn('Microphone permission request failed:', e);
      if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
        onErrorRef.current?.('Microphone permission denied. Click the lock/camera icon in your address bar to allow.');
      }
      return null;
    }
  };

  // ── Speech Recognition Setup ─────────────────────────────────────────────
  const setupSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const win = window as unknown as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      setSpeechSupported(false);
      return null;
    }

    try {
      const recognition = new SpeechRec();
      // continuous = false is standard and prevents Chrome internal buffering hangs
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isListeningRef.current = true;
        networkRetryCountRef.current = 0;
        setVoiceState('listening');
        startAudioMeter();
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalized = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalized += transcriptPiece + ' ';
          } else {
            interim += transcriptPiece;
          }
        }

        if (finalized) {
          accumulatedSpeechRef.current = (accumulatedSpeechRef.current + ' ' + finalized).trim();
        }

        const fullCurrent = (accumulatedSpeechRef.current + ' ' + interim).trim();
        if (fullCurrent) {
          setCurrentInterimText(fullCurrent);
        }

        // Reset silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        // Auto-commit on 1.8s silence if student has spoken enough words
        if (fullCurrent.length >= 8) {
          silenceTimerRef.current = setTimeout(() => {
            const finalWords = accumulatedSpeechRef.current.trim() || fullCurrent;
            if (finalWords && isListeningRef.current && !isThinkingRef.current) {
              stopListening();
              setCurrentInterimText('');
              accumulatedSpeechRef.current = '';
              handleStudentUtteranceInternal(finalWords);
            }
          }, 1800);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[STT] recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechSupported(false);
          onErrorRef.current?.('Microphone access blocked in browser. Please check address bar permissions.');
        }
      };

      recognition.onend = () => {
        // Restart cleanly after 150ms if user is still in listening mode
        if (isListeningRef.current && !isThinkingRef.current && !isSpeakingRef.current) {
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            if (isListeningRef.current && !isThinkingRef.current && !isSpeakingRef.current) {
              try {
                recognition.start();
              } catch (_) {}
            }
          }, 150);
          return;
        }

        isListeningRef.current = false;
        stopAudioMeter();
        if (!isThinkingRef.current && !isSpeakingRef.current) {
          setVoiceState('idle');
        }
      };

      return recognition;
    } catch (e) {
      console.error('Failed to create SpeechRecognition:', e);
      setSpeechSupported(false);
      return null;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    recognitionRef.current = setupSpeechRecognition();

    return () => {
      clearSpeechTimers();
      clearTimeout(restartTimeoutRef.current);
      stopAudioMeter();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch (_) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (_) {}
      }
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [setupSpeechRecognition]);

  // Internal start listening (Starts both Web Speech and MediaRecorder)
  const startListeningInternal = useCallback(async () => {
    if (isListeningRef.current || isSpeakingRef.current || isThinkingRef.current) return;

    // 1. Acquire microphone stream
    const stream = await ensureMicrophoneStream();

    accumulatedSpeechRef.current = '';
    setCurrentInterimText('');
    audioChunksRef.current = [];

    // 2. Start MediaRecorder as fail-safe audio buffer
    if (stream && typeof MediaRecorder !== 'undefined') {
      try {
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';
        const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        mr.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        mr.start(250);
        mediaRecorderRef.current = mr;
      } catch (e) {
        console.warn('MediaRecorder start error:', e);
      }
    }

    // 3. Start Web Speech recognition
    if (!recognitionRef.current) {
      recognitionRef.current = setupSpeechRecognition();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e: any) {
        if (e?.name === 'InvalidStateError') {
          try {
            recognitionRef.current.abort();
          } catch (_) {}
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
            } catch (_) {}
          }, 100);
        }
      }
    }

    isListeningRef.current = true;
    setVoiceState('listening');
    startAudioMeter();
  }, [setupSpeechRecognition]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop listening
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    clearTimeout(restartTimeoutRef.current);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }

    stopAudioMeter();
    if (!isThinkingRef.current && !isSpeakingRef.current) {
      setVoiceState('idle');
    }
  }, []);

  // Student Utterance Handler (calls Gemini /api/chat with text OR audio fallback)
  const handleStudentUtteranceInternal = useCallback(
    async (studentText?: string) => {
      stopListening();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      const textToSend = studentText?.trim() || '';

      // If we have text from Web Speech, send immediately!
      if (textToSend) {
        await executeChatCall(textToSend);
        return;
      }

      // If Web Speech was silent, check if MediaRecorder captured audio!
      if (audioChunksRef.current.length > 0) {
        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mediaRecorderRef.current?.mimeType || 'audio/webm',
          });

          if (audioBlob.size > 1000) {
            setVoiceState('thinking');
            isThinkingRef.current = true;
            stopAudioMeter();

            // Use Groq Whisper STT for accurate transcription
            const formData = new FormData();
            const audioFile = new File([audioBlob], 'audio.webm', {
              type: audioBlob.type || 'audio/webm',
            });
            formData.append('audio', audioFile);

            try {
              const sttRes = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
              });
              const sttData = await sttRes.json();
              const whisperText = sttData.text?.trim();

              if (whisperText && whisperText.length > 2) {
                // We got clean text from Groq Whisper — use it!
                await executeChatCall(whisperText);
                return;
              }
            } catch (sttErr) {
              console.warn('[Groq Whisper] STT failed, sending raw audio to chat:', sttErr);
              // Final fallback: send raw audio to chat endpoint for Groq to handle
              const reader = new FileReader();
              reader.onloadend = async () => {
                const base64Data = (reader.result as string).split(',')[1];
                await executeChatCall('', base64Data, audioBlob.type || 'audio/webm');
              };
              reader.readAsDataURL(audioBlob);
              return;
            }
          }
        } catch (e) {
          console.warn('Failed to parse recorded audio blob:', e);
        }
      }

      // If neither text nor audio was captured
      setVoiceState('idle');
      isThinkingRef.current = false;
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const executeChatCall = async (
    cleanText: string,
    studentAudioBase64?: string,
    studentAudioMime?: string
  ) => {
    isThinkingRef.current = true;
    setVoiceState('thinking');
    stopAudioMeter();

    if (cleanText) {
      const userMessage: ChatMessage = {
        sender: 'user',
        text: cleanText,
        timestamp: new Date().toISOString(),
      };
      setTranscript((prev) => [...prev, userMessage]);
      onUserMessageRef.current?.(cleanText);
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: interviewIdRef.current,
          studentMessage: cleanText || undefined,
          studentAudioBase64,
          studentAudioMime,
          projectTitle: projectTitleRef.current,
          techStack: techStackRef.current,
          projectDescription: projectDescRef.current,
          history: transcriptRef.current,
        }),
      });

      if (!res.ok) throw new Error(`Interviewer response failed (${res.status})`);
      const data = await res.json();
      let cleanAiResponse = typeof data.response === 'string' && data.response.trim()
        ? data.response.trim()
        : null;

      let cleanUserText = data.transcribedText;

      // Extract clean text if raw JSON was returned
      if (cleanAiResponse && cleanAiResponse.startsWith('{') && (cleanAiResponse.includes('"interviewerResponse"') || cleanAiResponse.includes('"response"'))) {
        try {
          const parsed = JSON.parse(cleanAiResponse);
          if (parsed.interviewerResponse || parsed.response) {
            cleanAiResponse = String(parsed.interviewerResponse || parsed.response).trim();
          }
          if (parsed.transcribedAnswer || parsed.transcript) {
            cleanUserText = String(parsed.transcribedAnswer || parsed.transcript).trim();
          }
        } catch (_) {
          // If JSON.parse fails due to unescaped quotes, safely extract without quote cutting
          const keyMatch = cleanAiResponse.match(/"(?:interviewerResponse|response)"\s*:\s*"/);
          if (keyMatch && keyMatch.index !== undefined) {
            const start = keyMatch.index + keyMatch[0].length;
            const remainder = cleanAiResponse.substring(start);
            const lastQuote = remainder.lastIndexOf('"');
            if (lastQuote !== -1) {
              cleanAiResponse = remainder.substring(0, lastQuote).replace(/\\"/g, '"').replace(/\\n/g, '\n').trim();
            }
          }
        }
      }

      if (!cleanAiResponse) {
        isThinkingRef.current = false;
        setVoiceState('idle');
        onErrorRef.current?.('Interviewer response was empty. Please try speaking again.');
        return;
      }

      // If audio was transcribed by Gemini, update transcript with the real words
      if (!cleanText && cleanUserText && cleanUserText !== 'Voice Response') {
        const userMsg: ChatMessage = {
          sender: 'user',
          text: cleanUserText,
          timestamp: new Date().toISOString(),
        };
        setTranscript((prev) => [...prev, userMsg]);
        onUserMessageRef.current?.(cleanUserText);
      }

      const aiMessage: ChatMessage = {
        sender: 'ai',
        text: cleanAiResponse,
        timestamp: new Date().toISOString(),
      };

      setTranscript((prev) => [...prev, aiMessage]);
      onAiResponseRef.current?.(cleanAiResponse);
      isThinkingRef.current = false;

      // Speak response through human interviewer or browser TTS
      if (useExternalTTS) {
        setVoiceState('speaking');
        isSpeakingRef.current = true;
        stopListening();
      } else {
        speakText(cleanAiResponse);
      }
    } catch (err: any) {
      console.error('Error getting AI response:', err);
      isThinkingRef.current = false;
      setVoiceState('idle');
      onErrorRef.current?.(err?.message || 'Error communicating with interviewer. Please try again.');
    }
  };

  const handleStudentUtterance = useCallback(
    (studentText: string) => {
      handleStudentUtteranceInternal(studentText);
    },
    [handleStudentUtteranceInternal]
  );

  const startListening = useCallback(async () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
    }
    await startListeningInternal();
  }, [startListeningInternal]);

  const toggleListening = useCallback(() => {
    if (voiceState === 'listening') {
      const current = (accumulatedSpeechRef.current + ' ' + currentInterimText).trim();
      stopListening();
      setCurrentInterimText('');
      accumulatedSpeechRef.current = '';
      handleStudentUtteranceInternal(current);
    } else if (voiceState === 'speaking') {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        isSpeakingRef.current = false;
      }
      clearSpeechTimers();
      startListening();
    } else if (voiceState === 'idle') {
      startListening();
    }
  }, [voiceState, currentInterimText, startListening, stopListening, handleStudentUtteranceInternal]);

  // Trigger initial question when room loads (stable callback)
  const triggerInitialQuestion = useCallback(
    async (overrideTitle?: string, overrideTech?: string) => {
      isThinkingRef.current = true;
      setVoiceState('thinking');
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interviewId: interviewIdRef.current,
            projectTitle: overrideTitle || projectTitleRef.current,
            techStack: overrideTech || techStackRef.current,
            projectDescription: projectDescRef.current,
            history: [],
          }),
        });

        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();
        const aiResponse = typeof data.response === 'string' && data.response.trim()
          ? data.response.trim()
          : null;

        if (!aiResponse) {
          isThinkingRef.current = false;
          setVoiceState('idle');
          onErrorRef.current?.('Could not load interview question. Please try refreshing the session.');
          return;
        }

        const aiMessage: ChatMessage = {
          sender: 'ai',
          text: aiResponse,
          timestamp: new Date().toISOString(),
        };

        setTranscript([aiMessage]);
        onAiResponseRef.current?.(aiResponse);
        isThinkingRef.current = false;
        if (useExternalTTS) {
          setVoiceState('speaking');
          isSpeakingRef.current = true;
          stopListening();
        } else {
          speakText(aiResponse);
        }
      } catch (err: any) {
        console.error('Error triggering initial question:', err);
        isThinkingRef.current = false;
        setVoiceState('idle');
        onErrorRef.current?.('Failed to connect to AI interviewer. Please check your connection.');
      }
    },
    [speakText]
  );

  const notifyInterviewerSpeechStart = useCallback(() => {
    isSpeakingRef.current = true;
    setVoiceState('speaking');
    stopListening();
  }, [stopListening]);

  const notifyInterviewerSpeechEnd = useCallback(() => {
    isSpeakingRef.current = false;
    setVoiceState('idle');
    setTimeout(() => {
      if (!isListeningRef.current && !isThinkingRef.current) {
        startListeningInternal();
      }
    }, 350);
  }, [startListeningInternal]);

  const submitCodeForReview = useCallback(
    async (code: string, language: string, output?: string) => {
      isThinkingRef.current = true;
      setVoiceState('thinking');
      stopAudioMeter();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      const formattedCodeMessage = `[Submitted Code (${language})]:\n\`\`\`${language}\n${code}\n\`\`\`${output ? `\n[Test Sandbox Output]:\n${output}` : ''}`;

      const userMessage: ChatMessage = {
        sender: 'user',
        text: formattedCodeMessage,
        timestamp: new Date().toISOString(),
      };
      setTranscript((prev) => [...prev, userMessage]);
      onUserMessageRef.current?.(formattedCodeMessage);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interviewId: interviewIdRef.current,
            studentMessage: `I've implemented the solution in ${language}. Please review my code logic, Big-O time and space complexity, and edge cases.`,
            studentCode: code,
            codeLanguage: language,
            codeOutput: output,
            projectTitle: projectTitleRef.current,
            techStack: techStackRef.current,
            projectDescription: projectDescRef.current,
            history: transcriptRef.current,
          }),
        });

        if (!res.ok) throw new Error(`Interviewer code evaluation failed (${res.status})`);
        const data = await res.json();
        let cleanAiResponse = typeof data.response === 'string' && data.response.trim()
          ? data.response.trim()
          : null;

        if (!cleanAiResponse) {
          isThinkingRef.current = false;
          setVoiceState('idle');
          onErrorRef.current?.('Could not get feedback on your code. Please try again.');
          return;
        }

        const aiMessage: ChatMessage = {
          sender: 'ai',
          text: cleanAiResponse,
          timestamp: new Date().toISOString(),
        };

        setTranscript((prev) => [...prev, aiMessage]);
        onAiResponseRef.current?.(cleanAiResponse);
        isThinkingRef.current = false;

        if (useExternalTTS) {
          setVoiceState('speaking');
          isSpeakingRef.current = true;
          stopListening();
        } else {
          speakText(cleanAiResponse);
        }
      } catch (err: any) {
        console.error('Error submitting code for review:', err);
        isThinkingRef.current = false;
        setVoiceState('idle');
        onErrorRef.current?.(err?.message || 'Error submitting code to interviewer.');
      }
    },
    [stopAudioMeter, useExternalTTS, stopListening, speakText]
  );

  return {
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
    stopListening,
    toggleListening,
    speakText,
    handleStudentUtterance,
    triggerInitialQuestion,
    submitCodeForReview,
    notifyInterviewerSpeechStart,
    notifyInterviewerSpeechEnd,
  };
}

