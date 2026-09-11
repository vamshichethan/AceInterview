import { NextResponse } from 'next/server';
import { getFeedbackReport } from '@/lib/mock-db';

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const report = await getFeedbackReport(params.id);
    if (!report) {
      return NextResponse.json({ error: 'Feedback report not found' }, { status: 404 });
    }
    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error fetching feedback report:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
