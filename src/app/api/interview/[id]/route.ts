import { NextResponse } from 'next/server';
import { getInterview, updateInterview } from '@/lib/mock-db';

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const interview = await getInterview(params.id);
    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }
    return NextResponse.json({ interview });
  } catch (error) {
    console.error('Error fetching interview:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const body = await req.json();
    const updated = await updateInterview(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }
    return NextResponse.json({ interview: updated });
  } catch (error) {
    console.error('Error updating interview:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
