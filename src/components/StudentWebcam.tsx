'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, Video, Mic, Volume2 } from 'lucide-react';

interface StudentWebcamProps {
  studentName?: string;
  isMicActive?: boolean;
}

export const StudentWebcam: React.FC<StudentWebcamProps> = ({
  studentName = 'Candidate',
  isMicActive = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false, // audio handled by Web Speech API
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraEnabled(true);
      }
    } catch (e) {
      console.warn('Camera access denied or unavailable:', e);
      setCameraAvailable(false);
      setCameraEnabled(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraEnabled(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!cameraEnabled || !video || !stream) return;

    video.srcObject = stream;
    video.play().catch(() => {});
  }, [cameraEnabled]);

  const toggleCamera = () => {
    if (cameraEnabled) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return (
    <div className="relative w-full max-w-[240px] aspect-video rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-xl group select-none">
      {cameraEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 text-slate-400 p-2 text-center">
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center mb-1">
            <CameraOff className="w-4 h-4 text-slate-500" />
          </div>
          <span className="text-[11px] font-medium text-slate-300">Camera Off</span>
          <button
            type="button"
            onClick={toggleCamera}
            className="mt-1 text-[10px] text-indigo-400 hover:text-indigo-300 underline"
          >
            Turn on webcam
          </button>
        </div>
      )}

      {/* Camera overlay indicators */}
      <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
        <span className="text-[10px] font-semibold text-white bg-slate-950/80 px-2 py-0.5 rounded backdrop-blur-md">
          {studentName} (You)
        </span>
        <div className="flex items-center gap-1">
          {isMicActive && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </div>
      </div>

      {/* Bottom control toggle */}
      {cameraAvailable && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <button
            type="button"
            onClick={toggleCamera}
            title={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
            className="p-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition"
          >
            {cameraEnabled ? (
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Video className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};
