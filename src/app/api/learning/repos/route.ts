import { NextResponse } from 'next/server';
import { fetchGitHubCurriculumRepos } from '@/lib/real-world-apis';

export async function GET() {
  try {
    const repos = await fetchGitHubCurriculumRepos();
    return NextResponse.json({ success: true, repos });
  } catch (err: any) {
    console.error('Error fetching GitHub repos:', err);
    return NextResponse.json({ success: false, repos: [] }, { status: 500 });
  }
}
