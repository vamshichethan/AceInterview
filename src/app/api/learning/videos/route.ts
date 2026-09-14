import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveYouTubeVideos } from '@/lib/real-world-apis';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const track = searchParams.get('track');
    let query = searchParams.get('q');

    if (!query && track) {
      switch (track) {
        case 'frontend':
          query = 'frontend developer react coding interview';
          break;
        case 'backend':
          query = 'backend system design microservices interview';
          break;
        case 'ai_ml':
          query = 'machine learning ai engineer interview';
          break;
        case 'devops':
          query = 'devops kubernetes docker sre interview';
          break;
        case 'mobile':
          query = 'android ios flutter mobile interview questions';
          break;
        case 'data_science':
          query = 'data science sql python interview questions';
          break;
        case 'sde':
        default:
          query = 'system design interview dsa coding preparation';
          break;
      }
    }

    const videos = await fetchLiveYouTubeVideos(query || undefined);
    return NextResponse.json({ success: true, videos });
  } catch (err: any) {
    console.error('Error fetching YouTube videos:', err);
    return NextResponse.json({ success: false, videos: [] }, { status: 500 });
  }
}
