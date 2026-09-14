'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Search,
  Building2,
  ExternalLink,
  Sparkles,
  TrendingUp,
  MapPin,
  Calendar,
  Filter,
  CheckCircle2,
  Zap,
  ArrowUpRight,
  Newspaper,
  Compass,
  ArrowRight,
  ShieldCheck,
  Flame,
  Award,
  Users,
} from 'lucide-react';
import { JobNewsItem, CompanyProfile, LiveJobPosting, TargetRole, TARGET_ROLE_LABELS } from '@/lib/types';
import { INITIAL_JOB_NEWS, INITIAL_COMPANIES, INITIAL_LIVE_JOBS } from '@/lib/jobs-seed';
import { SectionPaywallGuard } from '@/components/SectionPaywallGuard';

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'news' | 'companies'>('jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [selectedExperience, setSelectedExperience] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedNewsTag, setSelectedNewsTag] = useState<string>('all');

  const [selectedCompanyType, setSelectedCompanyType] = useState<string>('all');
  const [selectedHiringStatus, setSelectedHiringStatus] = useState<string>('all');
  const [freshersWelcomeOnly, setFreshersWelcomeOnly] = useState<boolean>(false);

  const [news, setNews] = useState<JobNewsItem[]>(INITIAL_JOB_NEWS);
  const [companies, setCompanies] = useState<CompanyProfile[]>(INITIAL_COMPANIES);
  const [jobs, setJobs] = useState<LiveJobPosting[]>(INITIAL_LIVE_JOBS);
  const [loading, setLoading] = useState(true);

  // Fetch live curated data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/jobs?type=all');
        if (res.ok) {
          const data = await res.json();
          if (data.news?.length > 0) setNews(data.news);
          if (data.companies?.length > 0) setCompanies(data.companies);
          if (data.jobs?.length > 0) setJobs(data.jobs);
        }
      } catch (err) {
        console.warn('Using cached offline job seed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtered "New This Week" highlight items
  const newThisWeekJobs = useMemo(() => {
    return jobs.filter((j) => j.isNewThisWeek).slice(0, 4);
  }, [jobs]);

  // Filtered Live Job Postings
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Track filter
      if (selectedTrack !== 'all' && job.targetTrack !== selectedTrack) return false;
      // Experience filter
      if (selectedExperience === 'freshers' && !job.experienceLevel.includes('0-1')) return false;
      if (selectedExperience === 'experienced' && job.experienceLevel.includes('0-1')) return false;
      // Platform filter
      if (selectedPlatform !== 'all' && !job.platform.toLowerCase().includes(selectedPlatform.toLowerCase())) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = job.roleTitle.toLowerCase().includes(q);
        const matchesComp = job.companyName.toLowerCase().includes(q);
        const matchesLoc = job.location.toLowerCase().includes(q);
        const matchesTag = job.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesComp && !matchesLoc && !matchesTag) return false;
      }
      return true;
    });
  }, [jobs, selectedTrack, selectedExperience, selectedPlatform, searchQuery]);

  // Filtered Jobs News
  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      if (selectedTrack !== 'all' && item.track !== 'all' && item.track !== selectedTrack) return false;
      if (selectedExperience === 'freshers' && item.experienceLevel === 'experienced') return false;
      if (selectedExperience === 'experienced' && item.experienceLevel === 'freshers') return false;
      if (selectedNewsTag !== 'all' && item.tag !== selectedNewsTag) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesHeadline = item.headline.toLowerCase().includes(q);
        const matchesComp = item.companyName.toLowerCase().includes(q);
        const matchesSummary = item.summary.toLowerCase().includes(q);
        if (!matchesHeadline && !matchesComp && !matchesSummary) return false;
      }
      return true;
    });
  }, [news, selectedTrack, selectedExperience, selectedNewsTag, searchQuery]);

  // Filtered Companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((comp) => {
      if (selectedTrack !== 'all' && !comp.targetTracks.includes(selectedTrack as TargetRole)) return false;
      if (selectedExperience === 'freshers' && !comp.freshersWelcome) return false;
      if (freshersWelcomeOnly && !comp.freshersWelcome) return false;
      if (selectedHiringStatus === 'actively_hiring' && comp.hiringStatus !== 'Actively Hiring') return false;
      if (selectedHiringStatus === 'selective' && comp.hiringStatus !== 'Selective Hires') return false;
      if (selectedCompanyType === 'startup' && comp.size !== 'Startup' && comp.size !== 'Growth Scaleup') return false;
      if (selectedCompanyType === 'mnc' && comp.size !== 'MNC / Enterprise') return false;
      if (selectedCompanyType === 'unicorn' && comp.size !== 'Unicorn') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = comp.name.toLowerCase().includes(q);
        const matchesSector = comp.sector.toLowerCase().includes(q);
        const matchesDesc = comp.description.toLowerCase().includes(q);
        if (!matchesName && !matchesSector && !matchesDesc) return false;
      }
      return true;
    });
  }, [companies, selectedTrack, selectedExperience, freshersWelcomeOnly, selectedHiringStatus, selectedCompanyType, searchQuery]);

  return (
    <SectionPaywallGuard
      sectionName="Jobs & News Feed"
      sectionDescription="Real-time verified technical openings, campus drives, layoff alerts, and company hiring trends."
      icon="jobs"
    >
      <div className="min-h-screen py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span>Live Job Postings &amp; Placement Intelligence</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Real-Time API Sync (Adzuna + Hacker News + Tech Networks)</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Verified Openings, Off-Campus Drives &amp; Hiring News.
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Curated direct-apply job requisitions aggregated across LinkedIn, Naukri, Internshala, Wellfound, and Google Careers with real-time campus drives and funding updates.
            </p>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 sm:gap-6 pt-2 text-xs text-slate-300 font-medium flex-wrap">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{jobs.length}+ Active Live Postings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>{companies.length} Verified Employers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Freshers &amp; Lateral Tracks</span>
              </div>
            </div>
          </div>

          {/* Quick Mock Interview Callout */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between gap-3 lg:w-80 shrink-0">
            <div>
              <span className="text-xs font-bold text-white block">Prepare Before Applying</span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Run an AI mock interview tailored to your target company and get real-world hiring committee feedback.
              </span>
            </div>
            <Link
              href="/student/setup"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start Pre-Application Mock</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── "NEW THIS WEEK" HIGHLIGHT STRIP ── */}
      {newThisWeekJobs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">
                New This Week — Urgent Requisitions &amp; Drives
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Surfaced within the last 7 days
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {newThisWeekJobs.map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-500/60 transition-all flex flex-col justify-between shadow-lg relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" />
                      Fresh Opening
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {job.platform}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                    {job.roleTitle}
                  </h4>
                  <p className="text-xs text-slate-300 font-medium mt-1">
                    {job.companyName}
                  </p>

                  <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {job.location}
                    </span>
                    {job.salaryOrStipend && (
                      <span className="text-emerald-400 font-medium">
                        &bull; {job.salaryOrStipend}
                      </span>
                    )}
                  </div>
                </div>

                <a
                  href={job.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300 transition-colors"
                >
                  <span>Apply on {job.platform}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── NAVIGATION TABS & SEARCH / FILTER CONTROLS ── */}
      <div className="space-y-4">
        {/* Module Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 flex-wrap">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'jobs'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Live Job Postings ({jobs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('news')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'news'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>Hiring &amp; Drives Feed ({news.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('companies')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'companies'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Company Directory ({companies.length})</span>
          </button>
        </div>

        {/* Global Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 flex-wrap">
          {/* Search box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'jobs'
                  ? 'Search role, company, React, Java...'
                  : activeTab === 'news'
                  ? 'Search hiring news, drives...'
                  : 'Search company, sector...'
              }
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
              >
                &times;
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {/* Track filter */}
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Role Tracks</option>
              <option value="sde">SDE / Core Engineering</option>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="fullstack">Full Stack</option>
              <option value="ai_ml">AI / ML</option>
              <option value="data_science">Data Science</option>
              <option value="devops">DevOps / Cloud</option>
              <option value="mobile">Mobile (Android/iOS)</option>
            </select>

            {/* Experience Filter */}
            <select
              value={selectedExperience}
              onChange={(e) => setSelectedExperience(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Experience Levels</option>
              <option value="freshers">Freshers &amp; Campus (0-1 YOE)</option>
              <option value="experienced">Lateral / Experienced (1+ YOE)</option>
            </select>

            {/* Platform Filter (Only for jobs tab) */}
            {activeTab === 'jobs' && (
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Platforms</option>
                <option value="adzuna">Adzuna Verified</option>
                <option value="arbeitnow">Arbeitnow</option>
                <option value="hacker news">Hacker News YC</option>
                <option value="linkedin">LinkedIn</option>
                <option value="naukri">Naukri</option>
                <option value="internshala">Internshala</option>
                <option value="wellfound">Wellfound</option>
                <option value="google careers">Google Careers</option>
                <option value="y combinator">Y Combinator</option>
              </select>
            )}

            {/* News Tag Filter (Only for news tab) */}
            {activeTab === 'news' && (
              <select
                value={selectedNewsTag}
                onChange={(e) => setSelectedNewsTag(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All News Tags</option>
                <option value="Campus Drive">Campus Drives</option>
                <option value="Hiring">Hiring Announcements</option>
                <option value="Funding">Funding-Linked</option>
                <option value="Layoff">Layoffs &amp; Restructuring</option>
              </select>
            )}

            {/* Company Filters (Only for companies tab) */}
            {activeTab === 'companies' && (
              <>
                <select
                  value={selectedHiringStatus}
                  onChange={(e) => setSelectedHiringStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Hiring Statuses</option>
                  <option value="actively_hiring">Actively Hiring Only</option>
                  <option value="selective">Selective Hires</option>
                </select>

                <select
                  value={selectedCompanyType}
                  onChange={(e) => setSelectedCompanyType(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Company Sizes</option>
                  <option value="startup">Startups &amp; Scaleups</option>
                  <option value="mnc">MNC / Enterprise</option>
                  <option value="unicorn">Unicorns</option>
                </select>

                <button
                  type="button"
                  onClick={() => setFreshersWelcomeOnly(!freshersWelcomeOnly)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    freshersWelcomeOnly
                      ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {freshersWelcomeOnly ? '✓ Freshers Welcome' : 'Freshers Welcome Only'}
                </button>
              </>
            )}

            {/* Reset Filters button */}
            {(selectedTrack !== 'all' || selectedExperience !== 'all' || selectedPlatform !== 'all' || selectedNewsTag !== 'all' || selectedCompanyType !== 'all' || selectedHiringStatus !== 'all' || freshersWelcomeOnly || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedTrack('all');
                  setSelectedExperience('all');
                  setSelectedPlatform('all');
                  setSelectedNewsTag('all');
                  setSelectedCompanyType('all');
                  setSelectedHiringStatus('all');
                  setFreshersWelcomeOnly(false);
                  setSearchQuery('');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-2 py-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── TAB 1: LIVE JOB POSTINGS ── */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing <strong className="text-white">{filteredJobs.length}</strong> active openings
            </span>
            <span>External redirects to verified employer portals</span>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400 space-y-3">
              <Briefcase className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No job postings found matching your filters</p>
              <button
                onClick={() => {
                  setSelectedTrack('all');
                  setSelectedExperience('all');
                  setSelectedPlatform('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div>
                    {/* Top pill bar */}
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-indigo-300">
                          {job.platform}
                        </span>
                        {job.isNewThisWeek && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" />
                            New This Week
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {job.postedDate}
                      </span>
                    </div>

                    {/* Title & Company */}
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {job.roleTitle}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-300 font-semibold">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{job.companyName}</span>
                      <span className="text-slate-500">&bull;</span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                    </div>

                    {/* Metadata & Requirements */}
                    <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-medium">
                        {job.experienceLevel}
                      </span>
                      {job.salaryOrStipend && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-bold">
                          {job.salaryOrStipend}
                        </span>
                      )}
                      {job.batchOrEligibility && (
                        <span className="text-[11px] text-slate-400 italic">
                          ({job.batchOrEligibility})
                        </span>
                      )}
                    </div>

                    {/* Tech Stack Tags */}
                    {job.tags && job.tags.length > 0 && (
                      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                        {job.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-850"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <Link
                      href={`/student/setup?role=${job.targetTrack}`}
                      className="text-[11px] font-semibold text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      title="Run an AI mock interview tailored to this role track"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Practice Mock Interview</span>
                    </Link>

                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
                    >
                      <span>Apply on {job.platform}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: JOBS NEWS FEED ── */}
      {activeTab === 'news' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing <strong className="text-white">{filteredNews.length}</strong> hiring announcements, drives &amp; market signals
            </span>
            <span>Real-time intelligence from company press releases &amp; placement cells</span>
          </div>

          {filteredNews.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400">
              No news items match your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNews.map((item) => {
                const tagColors: Record<string, string> = {
                  'Campus Drive': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
                  'Funding': 'bg-teal-500/10 text-teal-300 border-teal-500/30',
                  'Hiring': 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
                  'Layoff': 'bg-rose-500/10 text-rose-300 border-rose-500/30',
                };
                const tagColor = tagColors[item.tag] || 'bg-slate-800 text-slate-300 border-slate-700';

                return (
                  <div
                    key={item.id}
                    className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${tagColor}`}>
                          {item.tag}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {item.date}
                        </span>
                      </div>

                      <div className="flex items-start gap-3.5 mb-2.5">
                        {item.companyLogo ? (
                          <img
                            src={item.companyLogo}
                            alt={item.companyName}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-800 shrink-0 bg-slate-950 mt-0.5"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                            {item.companyName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                            {item.headline}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
                            <span className="font-semibold text-slate-300">{item.companyName}</span>
                            <span>&bull;</span>
                            <span className="italic text-slate-400">{item.source}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>

                    {item.linkUrl && (
                      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Verified Announcement</span>
                        <a
                          href={item.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <span>Read Source / Apply</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: COMPANY DIRECTORY ── */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing <strong className="text-white">{filteredCompanies.length}</strong> top product firms, unicorns &amp; MNCs
            </span>
            <span>Filterable by hiring status, sector &amp; freshers friendliness</span>
          </div>

          {filteredCompanies.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400">
              No companies match your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCompanies.map((comp) => {
                const statusColors: Record<string, string> = {
                  'Actively Hiring': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
                  'Selective Hires': 'bg-amber-500/10 text-amber-300 border-amber-500/30',
                  'Hiring Freeze': 'bg-rose-500/10 text-rose-300 border-rose-500/30',
                };
                const statusColor = statusColors[comp.hiringStatus] || 'bg-slate-800 text-slate-300 border-slate-700';

                return (
                  <div
                    key={comp.id}
                    className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-lg group"
                  >
                    <div>
                      {/* Company Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                          {comp.hiringStatus}
                        </span>
                        {comp.freshersWelcome && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            Freshers Welcome
                          </span>
                        )}
                      </div>

                      <div className="flex items-start gap-3.5 mb-2.5">
                        {comp.logo ? (
                          <img
                            src={comp.logo}
                            alt={comp.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-800 shrink-0 bg-slate-950"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-sm shrink-0">
                            {comp.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-black text-white group-hover:text-indigo-300 transition-colors truncate">
                            {comp.name}
                          </h3>
                          <div className="text-xs text-indigo-400 font-medium mt-0.5">
                            {comp.sector} &bull; <span className="text-slate-400">{comp.size}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 mt-2.5 leading-relaxed line-clamp-3">
                        {comp.description}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                        <div className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{comp.location}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap pt-1">
                          <span className="text-slate-400">Hires for:</span>
                          {comp.targetTracks.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-300 text-[10px] font-mono"
                            >
                              {t.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      {comp.openPositionsCount && (
                        <span className="text-[11px] text-emerald-400 font-semibold">
                          {comp.openPositionsCount}+ Openings
                        </span>
                      )}
                      <a
                        href={comp.careersUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors ml-auto"
                      >
                        <span>Official Careers</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>
    </SectionPaywallGuard>
  );
}
