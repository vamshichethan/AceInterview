import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveYouTubeVideos } from '@/lib/real-world-apis';

const TRACK_ROTATING_TOPICS: Record<string, string[]> = {
  sde: [
    'system design interview architecture distributed systems',
    'dsa leetcode patterns coding interview',
    'software engineer mock interview behavioral technical',
    'low level design lld object oriented design interview',
  ],
  frontend: [
    'frontend developer react coding interview questions',
    'javascript event loop async performance interview',
    'frontend machine coding round system design interview',
  ],
  backend: [
    'backend system design microservices interview',
    'sql database indexing scaling postgres redis interview',
    'rest api grpc distributed caching backend interview',
  ],
  ai_ml: [
    'machine learning ai engineer interview questions',
    'llm generative ai rag fine tuning interview',
    'deep learning data science end to end interview',
  ],
  devops: [
    'devops kubernetes docker sre interview preparation',
    'ci cd terraform cloud architecture interview questions',
  ],
  mobile: [
    'android kotlin architecture components interview',
    'ios swift swiftui mobile engineer interview',
    'flutter react native cross platform mobile interview',
  ],
  data_science: [
    'data science sql python interview questions',
    'machine learning statistics data analyst interview',
  ],
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const track = searchParams.get('track') || 'sde';
    let query = searchParams.get('q');

    if (!query) {
      // Rotates automatically every 12 hours (morning & evening cycle)
      const slot = Math.floor(Date.now() / (12 * 3600 * 1000));
      const topics = TRACK_ROTATING_TOPICS[track] || TRACK_ROTATING_TOPICS.sde;
      query = topics[slot % topics.length];
    }

    const videos = await fetchLiveYouTubeVideos(query || undefined);
    return NextResponse.json({ success: true, videos, query });
  } catch (err: any) {
    console.error('Error fetching YouTube videos:', err);
    return NextResponse.json({ success: false, videos: [] }, { status: 500 });
  }
}
