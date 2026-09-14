'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Sparkles,
  Search,
  CheckCircle2,
  Circle,
  ExternalLink,
  ChevronRight,
  Clock,
  Briefcase,
  Target,
  ArrowRight,
  Compass,
  FileText,
  Users,
  Layers,
  GraduationCap,
  PlayCircle,
  BookMarked,
  Award,
  Zap,
  Filter,
  Check,
  Star,
  GitFork,
  X,
  RotateCw,
} from 'lucide-react';
import {
  LEARNING_TRACKS,
  CAREER_PREP_GUIDES,
  LearningTrack,
  RoadmapStep,
  CuratedResource,
  CareerGuide,
} from '@/lib/learning-data';
import { SectionPaywallGuard } from '@/components/SectionPaywallGuard';

export default function LearningModulePage() {
  const [activeTab, setActiveTab] = useState<string>('sde');
  const [searchQuery, setSearchQuery] = useState('');
  const [completedTopics, setCompletedTopics] = useState<Record<string, boolean>>({});
  const [gitHubRepos, setGitHubRepos] = useState<any[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [liveVideos, setLiveVideos] = useState<any[]>([]);
  const [videoPageIndex, setVideoPageIndex] = useState<number>(0);
  const [videosLoading, setVideosLoading] = useState<boolean>(false);
  const [activeVideoModal, setActiveVideoModal] = useState<{ title: string; embedUrl: string } | null>(null);

  // Fetch live GitHub verified repository stats
  useEffect(() => {
    const fetchRepos = async () => {
      setReposLoading(true);
      try {
        const res = await fetch('/api/learning/repos');
        if (res.ok) {
          const data = await res.json();
          if (data.repos?.length > 0) {
            setGitHubRepos(data.repos);
          }
        }
      } catch (err) {
        console.warn('Failed to load GitHub repos:', err);
      } finally {
        setReposLoading(false);
      }
    };
    fetchRepos();
  }, []);

  // Fetch live YouTube masterclasses dynamically whenever activeTab changes
  useEffect(() => {
    const fetchVideos = async () => {
      setVideosLoading(true);
      try {
        const res = await fetch(`/api/learning/videos?track=${activeTab}`);
        if (res.ok) {
          const data = await res.json();
          if (data.videos?.length > 0) {
            setLiveVideos(data.videos);
            setVideoPageIndex(0);
          }
        }
      } catch (err) {
        console.warn('Failed to load YouTube videos:', err);
      } finally {
        setVideosLoading(false);
      }
    };
    fetchVideos();
  }, [activeTab]);

  const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('watch?v=')[1]?.split('&')[0];
      return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
    }
    if (url.includes('youtube.com/playlist?list=')) {
      const listId = url.split('list=')[1]?.split('&')[0];
      return `https://www.youtube-nocookie.com/embed/videoseries?list=${listId}`;
    }
    return null;
  };

  // Hydrate completed topics checklist from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ace_learning_completed_topics');
      if (saved) {
        setCompletedTopics(JSON.parse(saved));
      }
    } catch (_) {}
  }, []);

  const toggleTopicCompletion = (key: string) => {
    setCompletedTopics((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('ace_learning_completed_topics', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  // Find active track or career guide
  const currentTrack = useMemo(
    () => LEARNING_TRACKS.find((t) => t.id === activeTab),
    [activeTab]
  );
  const currentGuide = useMemo(
    () => CAREER_PREP_GUIDES.find((g) => g.id === activeTab),
    [activeTab]
  );

  // Filter roadmap steps based on search query
  const filteredSteps = useMemo(() => {
    if (!currentTrack) return [];
    if (!searchQuery.trim()) return currentTrack.roadmap;
    const q = searchQuery.toLowerCase();
    return currentTrack.roadmap.filter(
      (step) =>
        step.title.toLowerCase().includes(q) ||
        step.description.toLowerCase().includes(q) ||
        step.keyConcepts.some((c) => c.toLowerCase().includes(q)) ||
        step.curatedResources.some(
          (r) => r.title.toLowerCase().includes(q) || r.platform.toLowerCase().includes(q)
        )
    );
  }, [currentTrack, searchQuery]);

  // Calculate track progress
  const trackProgress = useMemo(() => {
    if (!currentTrack) return { total: 0, completed: 0, percentage: 0 };
    const total = currentTrack.roadmap.length;
    let completed = 0;
    currentTrack.roadmap.forEach((s) => {
      const key = `${currentTrack.id}_step_${s.stepNumber}`;
      if (completedTopics[key]) completed++;
    });
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [currentTrack, completedTopics]);

  return (
    <SectionPaywallGuard
      sectionName="Learning Hub & Roadmaps"
      sectionDescription="Structured engineering curriculum, video playlists, and vetted technical interview resources."
      icon="learn"
    >
      <div className="min-h-screen py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Engineered Interview Curriculum &amp; Career Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Master the Technical Hiring Bar.
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Ordered beginner-to-advanced roadmaps, verified free &amp; paid resources, concrete outcomes, and real-world placement frameworks for all 7 software tracks.
            </p>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 sm:gap-6 pt-2 text-xs text-slate-300 font-medium flex-wrap">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>7 Core Tech Tracks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookMarked className="w-4 h-4 text-teal-400" />
                <span>40+ Ordered Modules</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>100% Free Resources First</span>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="w-full md:w-80 flex flex-col gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, sheets, Striver, NeetCode..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>

            <Link
              href="/student/setup"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch AI Mock Assessment</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Track & Guides Navigation Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            Select Track or Placement Guide
          </span>
          <span className="text-[11px] text-slate-500">
            Click any track to inspect roadmaps &amp; curated links
          </span>
        </div>

        {/* Tab Pills Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
          {LEARNING_TRACKS.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  setSearchQuery('');
                }}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  isActive
                    ? 'bg-slate-900 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    {t.id.toUpperCase()}
                  </span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                </div>
                <div className={`text-xs sm:text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {t.title.split('&')[0].trim()}
                </div>
              </button>
            );
          })}

          {/* Role Agnostic Guides */}
          {CAREER_PREP_GUIDES.map((g) => {
            const isActive = activeTab === g.id;
            return (
              <button
                key={g.id}
                onClick={() => {
                  setActiveTab(g.id);
                  setSearchQuery('');
                }}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  isActive
                    ? 'bg-slate-900 border-teal-500/50 shadow-md shadow-teal-500/10'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    GUIDE
                  </span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />}
                </div>
                <div className={`text-xs sm:text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {g.title.split('(')[0].trim()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE VIEW: TECHNICAL TRACK ROADMAP */}
      {currentTrack && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Track Summary & Outcomes Card */}
          <div
            className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-br ${currentTrack.color.bg} border ${currentTrack.color.border} shadow-xl relative overflow-hidden`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${currentTrack.color.badgeText} ${currentTrack.color.badgeBg}`}
                  >
                    {currentTrack.badge}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {currentTrack.roadmap.length} Ordered Phases
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {currentTrack.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {currentTrack.shortDescription}
                </p>

                {/* Outcome Statement */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                    <Target className="w-3.5 h-3.5" />
                    <span>What You'll Learn (Core Technical Outcome)</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {currentTrack.whatYoullLearn}
                  </p>
                </div>

                {/* Target Roles */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-indigo-400" />
                    Target Job Roles:
                  </span>
                  {currentTrack.rolesHelps.map((role, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-medium px-2.5 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* Progress & Quick Assessment CTA */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between gap-4 md:w-72 flex-shrink-0">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-300">Curriculum Progress</span>
                    <span className="text-indigo-400 font-mono">{trackProgress.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-teal-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${trackProgress.percentage}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1.5 block">
                    {trackProgress.completed} of {trackProgress.total} phases checked off
                  </span>
                </div>

                <Link
                  href={`/student/setup?role=${currentTrack.targetRoleKey}`}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Practice AI Interview for This Track</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* LIVE GITHUB TOOLKITS & REPOSITORIES (POWERED BY GITHUB REST API) */}
          {gitHubRepos.length > 0 && (
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/20 mb-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Real-World Open Source Toolkits</span>
                  </div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Verified GitHub Prep Repositories
                  </h3>
                  <p className="text-xs text-slate-400">
                    Industry-standard interview cheatsheets, system design primers, and algorithmic guides synced live with GitHub.
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live GitHub API Sync
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                {gitHubRepos
                  .filter((repo) => repo.track === currentTrack.id || repo.track === 'all' || repo.track === 'sde')
                  .slice(0, 3)
                  .map((repo) => (
                    <a
                      key={repo.id}
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-indigo-500/40 transition-all group flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 truncate">
                            {repo.badge || 'Open Source Toolkit'}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{(repo.stars / 1000).toFixed(1)}k</span>
                          </div>
                        </div>

                        <div className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors">
                          {repo.fullName}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {repo.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-mono flex items-center gap-1">
                          <GitFork className="w-3 h-3 text-slate-500" />
                          <span>{(repo.forks / 1000).toFixed(1)}k forks</span>
                        </span>
                        <span className="text-indigo-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <span>Star on GitHub</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </a>
                  ))}
              </div>
            </div>
          )}

          {/* LIVE YOUTUBE VIDEO MASTERCLASSES (POWERED BY YOUTUBE DATA API V3) */}
          {liveVideos.length > 0 && (
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 text-[10px] font-bold uppercase tracking-wider border border-rose-500/20 mb-1">
                    <PlayCircle className="w-3 h-3 text-rose-400" />
                    <span>Real-World Video Masterclasses</span>
                  </div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Trending Placement &amp; Interview Lectures
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live curated video lectures streamed directly via YouTube Data API v3. Auto-rotates daily across high-yield subtopics (System Design, LeetCode, LLD &amp; Architecture) with zero ads.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                    Live YouTube API
                  </span>
                  {liveVideos.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setVideoPageIndex((prev) => (prev + 3 >= liveVideos.length ? 0 : prev + 3))}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-md"
                      title="Rotate to next trending video masterclasses"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${videosLoading ? 'animate-spin' : ''}`} />
                      <span>Next Masterclasses ({Math.floor(videoPageIndex / 3) + 1}/{Math.ceil(liveVideos.length / 3)})</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                {liveVideos.slice(videoPageIndex, videoPageIndex + 3).map((video) => (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => setActiveVideoModal({ title: video.title, embedUrl: video.embedUrl })}
                    className="p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-rose-500/40 transition-all group flex flex-col justify-between text-left cursor-pointer"
                  >
                    <div className="space-y-2.5">
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80">
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600">
                            <PlayCircle className="w-8 h-8" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-10 h-10 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg">
                            <PlayCircle className="w-6 h-6" />
                          </div>
                        </div>
                      </div>

                      <div className="font-bold text-xs text-white group-hover:text-rose-300 transition-colors line-clamp-2 leading-snug">
                        {video.title}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {video.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium truncate max-w-[140px]">
                        {video.channelTitle}
                      </span>
                      <span className="text-rose-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Watch In-App</span>
                        <PlayCircle className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sequential Ordered Roadmap Steps */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-400" />
                  <span>Curated Learning Roadmap (Beginner &rarr; Advanced)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Follow these ordered phases sequentially. Check off milestones as you master each topic.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline-block">
                Showing {filteredSteps.length} of {currentTrack.roadmap.length} modules
              </span>
            </div>

            {filteredSteps.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                No roadmap steps matched your search "{searchQuery}". Clear search to view all modules.
              </div>
            ) : (
              <div className="space-y-5">
                {filteredSteps.map((step) => {
                  const stepKey = `${currentTrack.id}_step_${step.stepNumber}`;
                  const isChecked = !!completedTopics[stepKey];

                  return (
                    <div
                      key={step.stepNumber}
                      className={`p-6 rounded-3xl border transition-all duration-200 ${
                        isChecked
                          ? 'bg-slate-900/40 border-emerald-500/30'
                          : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700'
                      }`}
                    >
                      {/* Step Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleTopicCompletion(stepKey)}
                            className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors mt-0.5 ${
                              isChecked
                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                            title={isChecked ? 'Mark as incomplete' : 'Mark as mastered'}
                          >
                            {isChecked ? <Check className="w-4 h-4 stroke-[3]" /> : <Circle className="w-3.5 h-3.5" />}
                          </button>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                                Phase {step.stepNumber}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  step.difficulty === 'Beginner'
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                    : step.difficulty === 'Intermediate'
                                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                    : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                                }`}
                              >
                                {step.difficulty}
                              </span>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {step.estimatedHours} hrs est.
                              </span>
                            </div>

                            <h4
                              className={`text-base sm:text-lg font-bold ${
                                isChecked ? 'text-slate-300 line-through decoration-emerald-500/50' : 'text-white'
                              }`}
                            >
                              {step.title}
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Key Concepts Covered */}
                      <div className="mt-4 pl-10">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Key Concepts Tested in Interviews:
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {step.keyConcepts.map((concept, cIdx) => (
                            <span
                              key={cIdx}
                              className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-medium"
                            >
                              &bull; {concept}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Curated Resources Section */}
                      <div className="mt-5 pl-10 pt-4 border-t border-slate-800/80">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-teal-400 mb-3 flex items-center gap-1.5">
                          <BookMarked className="w-3.5 h-3.5" />
                          <span>Curated Best Resources (Free First, High-Yield Quality)</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {step.curatedResources.map((res, rIdx) => {
                            const ytEmbed = getYouTubeEmbedUrl(res.url);
                            return ytEmbed ? (
                              <button
                                key={rIdx}
                                type="button"
                                onClick={() => setActiveVideoModal({ title: res.title, embedUrl: ytEmbed })}
                                className="p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800/90 hover:border-rose-500/40 transition-all group flex flex-col justify-between text-left cursor-pointer"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1">
                                      <PlayCircle className="w-3 h-3 text-rose-400" />
                                      <span>{res.platform}</span>
                                    </span>
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                                      Watch Video
                                    </span>
                                  </div>
                                  <h5 className="text-xs font-bold text-slate-200 group-hover:text-rose-300 transition-colors line-clamp-2">
                                    {res.title}
                                  </h5>
                                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                                    {res.description}
                                  </p>
                                </div>

                                <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-rose-400 font-semibold">
                                  <span className="flex items-center gap-1">
                                    <PlayCircle className="w-3.5 h-3.5" />
                                    <span>Play Video In-App</span>
                                  </span>
                                  <span className="text-xs">&rarr;</span>
                                </div>
                              </button>
                            ) : (
                              <a
                                key={rIdx}
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800/90 hover:border-indigo-500/40 transition-all group flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                      {res.platform}
                                    </span>
                                    <span
                                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                        res.isFree
                                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                      }`}
                                    >
                                      {res.isFree ? '100% Free' : 'Paid / Book'}
                                    </span>
                                  </div>
                                  <h5 className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors line-clamp-2">
                                    {res.title}
                                  </h5>
                                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                                    {res.description}
                                  </p>
                                </div>

                                <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-indigo-400 font-semibold">
                                  <span>Open Resource</span>
                                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACTIVE VIEW: ROLE-AGNOSTIC CAREER GUIDE */}
      {currentGuide && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-teal-950/40 via-slate-900 to-slate-950 border border-teal-500/30 shadow-xl relative overflow-hidden">
            <div className="max-w-3xl space-y-2.5">
              <span className="text-xs font-bold px-3 py-1 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300">
                {currentGuide.badge}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentGuide.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {currentGuide.shortDescription}
              </p>
            </div>
          </div>

          {/* Guide Sections */}
          <div className="space-y-6">
            {currentGuide.sections.map((section, sIdx) => (
              <div
                key={sIdx}
                className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg"
              >
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    {section.heading}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                    {section.summary}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Key Execution Directives:
                  </div>
                  <ul className="space-y-2">
                    {section.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2.5 leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Before / After Examples if present */}
                {section.examples && section.examples.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-teal-400">
                      Concrete Illustrated Examples:
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {section.examples.map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{ex.title}</span>
                            {ex.tag && (
                              <span
                                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                  ex.tag === 'ATS Optimized'
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                    : ex.tag === 'Needs Revision'
                                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                                    : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                                }`}
                              >
                                {ex.tag}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 whitespace-pre-line font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-800 leading-relaxed">
                            {ex.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Callout */}
          <div className="p-6 rounded-3xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-white">Ready to Put This Into Practice?</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Take an AI mock interview right now to test your behavioral responses and technical explanations.
              </p>
            </div>
            <Link
              href="/student/setup"
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start Assessment</span>
            </Link>
          </div>
        </div>
      )}

      {/* Interactive In-App Video Modal */}
      {activeVideoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveVideoModal(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-2.5 min-w-0 pr-4">
                <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                  <PlayCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white truncate">
                  {activeVideoModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition flex-shrink-0 cursor-pointer"
                aria-label="Close video player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Responsive 16:9 Video Container */}
            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={activeVideoModal.embedUrl}
                title={activeVideoModal.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3 bg-slate-950/90 border-t border-slate-800/80 text-xs text-slate-400">
              <span>Streaming in HD distraction-free</span>
              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </SectionPaywallGuard>
  );
}
