import { NextRequest, NextResponse } from 'next/server';
import {
  getJobNews,
  getCompanies,
  getLiveJobs,
  createJobNewsItem,
  deleteJobNewsItem,
  createCompanyProfile,
  createLiveJobPosting,
  deleteLiveJobPosting,
  getUserByToken,
  isSuperAdminEmail,
} from '@/lib/mock-db';
import {
  fetchAdzunaJobs,
  fetchArbeitnowJobs,
  fetchHackerNewsJobs,
  fetchRealWorldNews,
} from '@/lib/real-world-apis';
import { LiveJobPosting, CompanyProfile } from '@/lib/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const track = searchParams.get('track') || undefined;
    const level = searchParams.get('level') || undefined;
    const platform = searchParams.get('platform') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const search = searchParams.get('search') || undefined;
    const type = searchParams.get('type') || 'all'; // 'all' | 'news' | 'companies' | 'jobs'

    let news = null;
    let companies = null;
    let jobs = null;

    if (type === 'all' || type === 'jobs') {
      const dbJobs = await getLiveJobs({
        track: track,
        experienceLevel: level,
        platform: platform,
        search: search,
      });

      // Fetch in parallel from live APIs
      const [adzunaJobs, arbeitnowJobs, hnJobs] = await Promise.all([
        fetchAdzunaJobs(track, search),
        fetchArbeitnowJobs(),
        fetchHackerNewsJobs(),
      ]);

      // Combine
      const allLive = [...dbJobs, ...adzunaJobs, ...hnJobs, ...arbeitnowJobs];

      // Filter by track, level, platform, search if specified
      let filtered = allLive;
      if (track && track !== 'all') {
        filtered = filtered.filter((j) => j.targetTrack === track || j.targetTrack === 'sde');
      }
      if (level && level !== 'all') {
        filtered = filtered.filter((j) => j.experienceLevel?.toLowerCase().includes(level.toLowerCase()));
      }
      if (platform && platform !== 'all') {
        filtered = filtered.filter((j) => j.platform?.toLowerCase() === platform.toLowerCase());
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (j) =>
            j.roleTitle?.toLowerCase().includes(q) ||
            j.companyName?.toLowerCase().includes(q) ||
            j.location?.toLowerCase().includes(q) ||
            j.tags?.some((t) => t.toLowerCase().includes(q))
        );
      }

      // Deduplicate by URL or Title+Company
      const seen = new Set<string>();
      const deduped: LiveJobPosting[] = [];
      for (const j of filtered) {
        const key = j.applyUrl || `${j.roleTitle}-${j.companyName}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(j);
        }
      }
      jobs = deduped;
    }

    if (type === 'all' || type === 'news') {
      const dbNews = await getJobNews({
        track: track,
        experienceLevel: level,
        tag: tag,
      });
      // Fetch live real-world news
      const liveNews = await fetchRealWorldNews();
      // Combine: custom db news first, followed by live news
      const combined = [...dbNews];
      for (const item of liveNews) {
        if (!combined.some((n) => n.id === item.id || n.headline === item.headline)) {
          combined.push(item);
        }
      }
      news = combined;
    }

    if (type === 'all' || type === 'companies') {
      const dbCompanies = await getCompanies({
        search: search,
      });

      // Extract unique companies from live jobs to keep company directory dynamically updated
      const activeEmployerMap = new Map<string, CompanyProfile>();
      dbCompanies.forEach((c) => activeEmployerMap.set(c.name.toLowerCase(), c));

      if (jobs && jobs.length > 0) {
        jobs.slice(0, 30).forEach((j) => {
          const key = j.companyName.toLowerCase();
          if (!activeEmployerMap.has(key) && j.companyName !== 'Tech Company' && j.companyName.length > 2) {
            activeEmployerMap.set(key, {
              id: `comp-live-${Math.random().toString(36).slice(2, 8)}`,
              name: j.companyName,
              sector: 'Information Technology & Software',
              size: 'Growth Scaleup',
              hiringStatus: 'Actively Hiring',
              freshersWelcome: j.experienceLevel === 'Freshers (0-1 YOE)',
              targetTracks: [j.targetTrack || 'sde'],
              careersUrl: j.applyUrl,
              location: j.location,
              description: `Actively recruiting for ${j.roleTitle} in ${j.location}. Verified through live API requisition.`,
              openPositionsCount: 1,
            });
          }
        });
      }

      companies = Array.from(activeEmployerMap.values());
    }

    return NextResponse.json({
      news: news || [],
      companies: companies || [],
      jobs: jobs || [],
      meta: {
        timestamp: new Date().toISOString(),
        totalNews: news?.length || 0,
        totalCompanies: companies?.length || 0,
        totalJobs: jobs?.length || 0,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/jobs:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve job market intelligence' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let token = req.cookies.get('vantage_session')?.value;
    if (!token) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    const user = token ? await getUserByToken(token) : null;
    const isAdmin = user && (user.role === 'admin' || user.can_access_dashboard || isSuperAdminEmail(user.email));

    // Admin authorization check
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Placement administrator access required to manage job listings.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, entityType, data, id } = body;

    if (action === 'create') {
      if (entityType === 'job') {
        const newJob = await createLiveJobPosting(data);
        return NextResponse.json({ success: true, item: newJob });
      } else if (entityType === 'news') {
        const newNews = await createJobNewsItem(data);
        return NextResponse.json({ success: true, item: newNews });
      } else if (entityType === 'company') {
        const newComp = await createCompanyProfile(data);
        return NextResponse.json({ success: true, item: newComp });
      }
    } else if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'Missing entity ID to delete' }, { status: 400 });
      }
      if (entityType === 'job') {
        const deleted = await deleteLiveJobPosting(id);
        return NextResponse.json({ success: deleted });
      } else if (entityType === 'news') {
        const deleted = await deleteJobNewsItem(id);
        return NextResponse.json({ success: deleted });
      }
    }

    return NextResponse.json({ error: 'Invalid action or entityType' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in POST /api/jobs:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to process job management request' },
      { status: 500 }
    );
  }
}
