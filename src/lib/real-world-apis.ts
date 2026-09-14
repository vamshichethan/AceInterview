import { LiveJobPosting, JobNewsItem, CompanyProfile, TargetRole } from './types';

// In-memory cache to prevent hitting rate limits repeatedly
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache
let cachedJobs: CacheEntry<LiveJobPosting[]> | null = null;
let cachedNews: CacheEntry<JobNewsItem[]> | null = null;
let cachedGitHubRepos: CacheEntry<any[]> | null = null;

// Map user selected track to Adzuna search terms
function getTrackSearchKeywords(track?: string): string {
  switch (track) {
    case 'frontend':
      return 'frontend developer';
    case 'backend':
      return 'backend developer';
    case 'ai_ml':
      return 'machine learning';
    case 'devops':
      return 'devops engineer';
    case 'mobile':
      return 'mobile developer';
    case 'data_science':
      return 'data scientist';
    case 'sde':
    default:
      return 'software engineer';
  }
}

// Map track string to TargetRole enum
function normalizeTargetTrack(title: string, desc: string): TargetRole {
  const text = `${title} ${desc}`.toLowerCase();
  if (text.includes('frontend') || text.includes('react') || text.includes('angular') || text.includes('vue')) {
    return 'frontend';
  }
  if (text.includes('backend') || text.includes('node') || text.includes('spring') || text.includes('django') || text.includes('golang')) {
    return 'backend';
  }
  if (text.includes('machine learning') || text.includes('ai engineer') || text.includes('data scientist') || text.includes('nlp')) {
    return 'ai_ml';
  }
  if (text.includes('devops') || text.includes('cloud') || text.includes('kubernetes') || text.includes('docker') || text.includes('sre')) {
    return 'devops';
  }
  if (text.includes('android') || text.includes('ios') || text.includes('flutter') || text.includes('react native')) {
    return 'mobile';
  }
  if (text.includes('data analyst') || text.includes('bi analyst') || text.includes('tableau') || text.includes('data engineer')) {
    return 'data_science';
  }
  return 'sde';
}

/**
 * 1. Fetch Real Live Jobs from Adzuna API (India & Global)
 */
export async function fetchAdzunaJobs(track?: string, search?: string): Promise<LiveJobPosting[]> {
  const appId = process.env.ADZUNA_APP_ID || 'e6f8389c';
  const appKey = process.env.ADZUNA_APP_KEY || '0f8269f9a25c268ceacbe274f0aef199';

  if (!appId || !appKey) return [];

  try {
    const keywords = search ? encodeURIComponent(search) : encodeURIComponent(getTrackSearchKeywords(track));
    const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=30&what=${keywords}&content-type=application/json`;

    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) {
      console.warn(`Adzuna API returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    const results = data.results || [];

    return results.map((item: any) => {
      const companyName = item.company?.display_name || 'Tech Company';
      const location = item.location?.display_name || 'India (Remote / Hybrid)';
      const desc = item.description || '';
      const title = item.title || 'Software Engineer';
      const isNew = Date.now() - new Date(item.created).getTime() < 7 * 86400000;

      let salaryText = 'Competitive Industry Standards';
      if (item.salary_min && item.salary_max) {
        salaryText = `₹${Math.round(item.salary_min / 100000)} - ₹${Math.round(item.salary_max / 100000)} LPA`;
      } else if (item.salary_min) {
        salaryText = `₹${Math.round(item.salary_min / 100000)}+ LPA`;
      }

      const tags: string[] = ['Adzuna Verified', 'Live Opening'];
      if (location.toLowerCase().includes('remote')) tags.push('Remote Friendly');
      if (title.toLowerCase().includes('intern')) tags.push('Internship');
      if (title.toLowerCase().includes('junior') || desc.toLowerCase().includes('fresher') || desc.toLowerCase().includes('0-1')) {
        tags.push('Freshers Welcome');
      }

      return {
        id: `adzuna-${item.id}`,
        roleTitle: title.replace(/<\/?[^>]+(>|$)/g, ''), // Strip any HTML tags
        companyName,
        location,
        experienceLevel: desc.toLowerCase().includes('senior') || desc.toLowerCase().includes('lead')
          ? 'Mid-Senior (3+ YOE)'
          : desc.toLowerCase().includes('1-3')
          ? 'Associate (1-3 YOE)'
          : 'Freshers (0-1 YOE)',
        targetTrack: normalizeTargetTrack(title, desc),
        platform: 'Adzuna Verified',
        applyUrl: item.redirect_url,
        postedDate: item.created || new Date().toISOString(),
        isNewThisWeek: isNew,
        tags,
        salaryOrStipend: salaryText,
        batchOrEligibility: '2023, 2024, 2025 & 2026 Batch Eligible',
      } as LiveJobPosting;
    });
  } catch (err) {
    console.error('Failed to fetch Adzuna jobs:', err);
    return [];
  }
}

/**
 * 2. Fetch Live Tech Jobs from Arbeitnow API
 */
export async function fetchArbeitnowJobs(): Promise<LiveJobPosting[]> {
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.data || [];

    return items.slice(0, 15).map((item: any) => ({
      id: `arbeitnow-${item.slug || Math.random().toString(36).slice(2, 8)}`,
      roleTitle: item.title || 'Software Developer',
      companyName: item.company_name || 'Engineering Team',
      location: item.remote ? 'Remote (Worldwide)' : item.location || 'Global Tech Hub',
      experienceLevel: 'Associate (1-3 YOE)',
      targetTrack: normalizeTargetTrack(item.title || '', item.description || ''),
      platform: 'Arbeitnow',
      applyUrl: item.url,
      postedDate: new Date().toISOString(),
      isNewThisWeek: true,
      tags: ['Arbeitnow', 'Remote / Global', ...(item.tags || []).slice(0, 2)],
      salaryOrStipend: 'Euro / USD Market Competitive',
      batchOrEligibility: 'All Qualified Tech Candidates',
    })) as LiveJobPosting[];
  } catch (err) {
    console.error('Failed to fetch Arbeitnow jobs:', err);
    return [];
  }
}

/**
 * 3. Fetch Hacker News Live Y Combinator & Startup Job Stories
 */
export async function fetchHackerNewsJobs(): Promise<LiveJobPosting[]> {
  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/jobstories.json', { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const ids: number[] = await res.json();
    if (!ids || ids.length === 0) return [];

    // Fetch details for the top 8 stories
    const topIds = ids.slice(0, 8);
    const storyPromises = topIds.map(async (id) => {
      try {
        const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        if (itemRes.ok) return await itemRes.json();
      } catch (_) {
        return null;
      }
    });

    const stories = (await Promise.all(storyPromises)).filter(Boolean);

    return stories.map((s: any) => {
      // Titles are often in the form: "Company (YC X) is hiring a Role"
      const title = s.title || 'Software Engineer at Tech Startup';
      let companyName = 'YC Startup';
      const ycMatch = title.match(/^([^(]+)\s*(\([^)]+\))?\s*(is hiring|seeks|looking for)/i);
      if (ycMatch && ycMatch[1]) {
        companyName = ycMatch[1].trim();
      }

      return {
        id: `hn-${s.id}`,
        roleTitle: title,
        companyName,
        location: 'Remote / US / Global',
        experienceLevel: 'Associate (1-3 YOE)',
        targetTrack: normalizeTargetTrack(title, ''),
        platform: 'Hacker News YC',
        applyUrl: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
        postedDate: s.time ? new Date(s.time * 1000).toISOString() : new Date().toISOString(),
        isNewThisWeek: true,
        tags: ['Y Combinator', 'Hacker News Live', 'High Growth Startup'],
        salaryOrStipend: 'Top Tier Startup Equity + Salary',
        batchOrEligibility: 'Immediate Hiring Requisition',
      } as LiveJobPosting;
    });
  } catch (err) {
    console.error('Failed to fetch Hacker News jobs:', err);
    return [];
  }
}

/**
 * 4. Aggregate Real-World Tech & Hiring News
 */
export async function fetchRealWorldNews(): Promise<JobNewsItem[]> {
  if (cachedNews && Date.now() - cachedNews.timestamp < CACHE_TTL_MS) {
    return cachedNews.data;
  }

  const liveNews: JobNewsItem[] = [];

  // 1. Fetch live breaking news from GNews API (India tech hiring & campus drives)
  const gnewsKey = process.env.GNEWS_API_KEY || '432c3dfe8c67ace60c9abfd3ba1ed128';
  if (gnewsKey) {
    try {
      const gnewsUrl = `https://gnews.io/api/v4/search?q=tech%20hiring%20OR%20campus%20placement%20OR%20software%20jobs&lang=en&country=in&max=8&apikey=${gnewsKey}`;
      const gres = await fetch(gnewsUrl, { next: { revalidate: 3600 } });
      if (gres.ok) {
        const gdata = await gres.json();
        const articles = gdata.articles || [];
        articles.forEach((art: any) => {
          const title = art.title || '';
          const desc = art.description || '';
          const lower = `${title} ${desc}`.toLowerCase();

          let tag: 'Hiring' | 'Layoff' | 'Funding' | 'Campus Drive' = 'Hiring';
          if (lower.includes('campus') || lower.includes('placement') || lower.includes('freshers')) {
            tag = 'Campus Drive';
          } else if (lower.includes('layoff') || lower.includes('cut') || lower.includes('fire')) {
            tag = 'Layoff';
          } else if (lower.includes('fund') || lower.includes('raise') || lower.includes('valuation') || lower.includes('series')) {
            tag = 'Funding';
          }

          liveNews.push({
            id: `gnews-${art.url ? Buffer.from(art.url).toString('base64').slice(0, 16) : Math.random().toString(36).slice(2, 8)}`,
            headline: title,
            companyName: art.source?.name || 'Tech Media',
            companyLogo: art.image,
            date: art.publishedAt || new Date().toISOString(),
            source: art.source?.name || 'Google News',
            summary: desc || 'Breaking updates on engineering hiring, campus drives, and tech industry job markets.',
            tag,
            track: 'all',
            experienceLevel: 'all',
            linkUrl: art.url,
            isNewThisWeek: true,
          });
        });
      }
    } catch (err) {
      console.warn('GNews fetch error:', err);
    }
  }

  try {
    // Fetch top stories from Hacker News and filter for tech hiring, funding, layoffs
    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', { next: { revalidate: 1800 } });
    if (res.ok) {
      const ids: number[] = await res.json();
      const sampleIds = ids.slice(0, 30);
      const items = await Promise.all(
        sampleIds.map(async (id) => {
          try {
            const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
            if (r.ok) return await r.json();
          } catch (_) {}
          return null;
        })
      );

      items.filter(Boolean).forEach((story: any) => {
        const title = (story.title || '').toLowerCase();
        let tag: 'Hiring' | 'Layoff' | 'Funding' | 'Campus Drive' | null = null;
        if (title.includes('hiring') || title.includes('jobs') || title.includes('careers')) tag = 'Hiring';
        else if (title.includes('layoff') || title.includes('job cuts') || title.includes('shutting down')) tag = 'Layoff';
        else if (title.includes('raises') || title.includes('funding') || title.includes('series') || title.includes('valuation')) tag = 'Funding';

        if (tag && story.url) {
          liveNews.push({
            id: `hn-news-${story.id}`,
            headline: story.title,
            companyName: 'Tech Industry',
            date: story.time ? new Date(story.time * 1000).toISOString() : new Date().toISOString(),
            source: 'Hacker News',
            summary: `Breaking tech industry discussion on Hacker News with ${story.score || 0} upvotes and active community insights.`,
            tag,
            track: 'all',
            experienceLevel: 'all',
            linkUrl: story.url,
            isNewThisWeek: true,
          });
        }
      });
    }
  } catch (e) {
    console.warn('Hacker News news fetch error:', e);
  }

  // Also fetch tech career articles from Dev.to API
  try {
    const devToRes = await fetch('https://dev.to/api/articles?tag=career&per_page=10', { next: { revalidate: 1800 } });
    if (devToRes.ok) {
      const articles = await devToRes.json();
      articles.forEach((art: any) => {
        liveNews.push({
          id: `devto-${art.id}`,
          headline: art.title,
          companyName: art.organization?.name || art.user?.name || 'Dev.to Tech',
          companyLogo: art.organization?.profile_image || art.user?.profile_image,
          date: art.published_at || new Date().toISOString(),
          source: 'Dev.to',
          summary: art.description || 'Actionable technical hiring insights, system design breakdowns, and developer hiring trends.',
          tag: 'Hiring',
          track: 'all',
          experienceLevel: 'all',
          linkUrl: art.url,
          isNewThisWeek: true,
        });
      });
    }
  } catch (e) {
    console.warn('Dev.to articles fetch error:', e);
  }

  if (liveNews.length > 0) {
    cachedNews = { data: liveNews, timestamp: Date.now() };
  }
  return liveNews;
}

/**
 * 5. Fetch GitHub Live Repository Data using GITHUB_TOKEN
 */
export async function fetchGitHubCurriculumRepos() {
  if (cachedGitHubRepos && Date.now() - cachedGitHubRepos.timestamp < CACHE_TTL_MS) {
    return cachedGitHubRepos.data;
  }

  const token = process.env.GITHUB_TOKEN || '';
  const headers: Record<string, string> = {
    'User-Agent': 'AceInterview-AI',
    Accept: 'application/vnd.github+json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const targetRepos = [
    { owner: 'donnemartin', repo: 'system-design-primer', track: 'sde', badge: 'Must-Know System Design' },
    { owner: 'yangshun', repo: 'tech-interview-handbook', track: 'sde', badge: 'DSA & Behavioral Guide' },
    { owner: 'jwasham', repo: 'coding-interview-university', track: 'sde', badge: 'Computer Science Core' },
    { owner: 'trekhleb', repo: 'javascript-algorithms', track: 'frontend', badge: 'Algorithms in JS' },
    { owner: 'kamranahmedse', repo: 'developer-roadmap', track: 'all', badge: 'Official Engineering Roadmap' },
    { owner: 'neetcode-gh', repo: 'leetcode', track: 'sde', badge: 'NeetCode 150 Solved' },
    { owner: 'ossu', repo: 'computer-science', track: 'sde', badge: 'Open-Source CS Degree' },
  ];

  try {
    const results = await Promise.all(
      targetRepos.map(async (item) => {
        try {
          const res = await fetch(`https://api.github.com/repos/${item.owner}/${item.repo}`, {
            headers,
            next: { revalidate: 3600 },
          });
          if (res.ok) {
            const data = await res.json();
            return {
              id: `${item.owner}/${item.repo}`,
              name: data.name,
              fullName: data.full_name,
              stars: data.stargazers_count,
              forks: data.forks_count,
              description: data.description,
              url: data.html_url,
              language: data.language,
              updatedAt: data.updated_at,
              track: item.track,
              badge: item.badge,
            };
          }
        } catch (_) {}
        return null;
      })
    );

    const valid = results.filter(Boolean);
    if (valid.length > 0) {
      cachedGitHubRepos = { data: valid, timestamp: Date.now() };
    }
    return valid;
  } catch (err) {
    console.error('Failed to fetch GitHub curriculum repos:', err);
    return [];
  }
}

/**
 * 6. Fetch Live Video Tutorials & Masterclasses via YouTube Data API v3
 */
export interface LiveYouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  videoUrl: string;
  embedUrl: string;
  publishedAt: string;
}

const cachedYouTubeVideos = new Map<string, { data: LiveYouTubeVideo[]; timestamp: number }>();

export async function fetchLiveYouTubeVideos(searchQuery?: string): Promise<LiveYouTubeVideo[]> {
  const q = searchQuery || 'system design interview dsa coding preparation';
  const cached = cachedYouTubeVideos.get(q);
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return cached.data;
  }

  const ytKey = process.env.YOUTUBE_API_KEY || 'AIzaSyCe2I2_XIuCu1PwSxEjdNp55u83n7kfUak';
  if (!ytKey) return [];

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=9&key=${ytKey}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.warn(`YouTube API returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    const items = data.items || [];

    const videos: LiveYouTubeVideo[] = items
      .map((item: any) => {
        const vid = item.id?.videoId;
        if (!vid) return null;
        return {
          id: vid,
          title: (item.snippet?.title || 'Coding Interview Tutorial')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'"),
          description: item.snippet?.description || 'Curated high-yield video tutorial covering interview patterns.',
          thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || '',
          channelTitle: item.snippet?.channelTitle || 'Tech Channel',
          videoUrl: `https://www.youtube.com/watch?v=${vid}`,
          embedUrl: `https://www.youtube-nocookie.com/embed/${vid}?autoplay=1`,
          publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
        };
      })
      .filter(Boolean);

    if (videos.length > 0) {
      cachedYouTubeVideos.set(q, { data: videos, timestamp: Date.now() });
    }
    return videos;
  } catch (err) {
    console.error('Failed to fetch YouTube videos:', err);
    return [];
  }
}

