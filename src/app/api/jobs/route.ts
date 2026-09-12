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

    if (type === 'all' || type === 'news') {
      news = await getJobNews({
        track: track,
        experienceLevel: level,
        tag: tag,
      });
    }

    if (type === 'all' || type === 'companies') {
      companies = await getCompanies({
        search: search,
      });
    }

    if (type === 'all' || type === 'jobs') {
      jobs = await getLiveJobs({
        track: track,
        experienceLevel: level,
        platform: platform,
        search: search,
      });
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
