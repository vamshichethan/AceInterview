import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveYouTubeVideos } from '@/lib/real-world-apis';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || undefined;
    const videos = await fetchLiveYouTubeVideos(query);
    return NextResponse.json({ success: true, videos });
  } catch (err: any) {
    console.error('Error fetching YouTube videos:', err);
    return NextResponse.json({ success: false, videos: [] }, { status: 500 });
  }
}
