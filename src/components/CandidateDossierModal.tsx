'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  X,
  Award,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ArrowUpRight,
  Code2,
  Cpu,
  MessageSquare,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { FeedbackReport } from '@/lib/types';

interface CandidateDossierModalProps {
  interviewId: string | null;
  onClose: () => void;
}

export function CandidateDossierModal({ interviewId, onClose }: CandidateDossierModalProps) {
  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!interviewId) {
      setReport(null);
      return;
    }

    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/report/${interviewId}`);
        if (!res.ok) throw new Error('Failed to load candidate dossier');
        const data = await res.json();
        setReport(data.report);
      } catch (err: any) {
        setError(err.message || 'Error loading dossier');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [interviewId]);

  if (!interviewId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0d121f] border border-cyan-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/60 text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
            <p className="text-xs text-slate-400">Loading verified candidate dossier...</p>
          </div>
        ) : error || !report ? (
          <div className="py-16 text-center">
            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <p className="text-sm text-slate-300 mb-4">{error || 'Dossier not found'}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-white"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <ShieldCheck className="w-3 h-3" /> Verified Evaluation Dossier
                </span>
                {report.interview?.target_role && (
                  <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase">
                    {report.interview.target_role} Track
                  </span>
                )}
                {report.overall_verdict && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      report.overall_verdict.toLowerCase().includes('strong')
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : report.overall_verdict.toLowerCase().includes('hire')
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    Verdict: {report.overall_verdict}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold text-white">
                {report.interview?.student?.name || 'Candidate Evaluation'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {report.interview?.student?.branch || 'Engineering'} &bull; Evaluated {new Date(report.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Technical Caliber</div>
                <div className="text-2xl font-black text-cyan-300 mt-1">{report.technical_score} <span className="text-xs text-slate-500 font-normal">/ 10</span></div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Communication</div>
                <div className="text-2xl font-black text-emerald-300 mt-1">{report.communication_score} <span className="text-xs text-slate-500 font-normal">/ 10</span></div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Confidence</div>
                <div className="text-2xl font-black text-indigo-300 mt-1">{report.confidence_score || 7} <span className="text-xs text-slate-500 font-normal">/ 10</span></div>
              </div>
            </div>

            {/* Project Evaluated */}
            {report.interview && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span>Project Evaluated: {report.interview.project_title}</span>
                </div>
                <div className="text-xs text-slate-400 font-mono mb-2">
                  Stack: {report.interview.tech_stack}
                </div>
                {report.interview.project_description && (
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {report.interview.project_description}
                  </p>
                )}
              </div>
            )}

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 mb-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Validated Strengths</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {report.strengths.slice(0, 3).map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">&bull;</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 mb-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Identified Gaps &amp; Deficits</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {report.improvements.slice(0, 3).map((imp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-rose-400 mt-0.5">&bull;</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Topic Tags */}
            {report.topic_tags && report.topic_tags.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Evaluated Competencies
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {report.topic_tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition"
              >
                Dismiss Preview
              </button>

              <Link
                href={`/student/report/${interviewId}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition"
              >
                <span>Open Full Verified Dossier</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
