import { NextRequest, NextResponse } from 'next/server';
import { groqKeyPool } from '@/lib/groq-pool';
import Groq from 'groq-sdk';

/**
 * /api/transcribe
 *
 * Transcribes audio using Groq's Whisper-large-v3 model.
 * Accepts a multipart form with an audio file field called "audio".
 *
 * Returns: { text: string }
 */
export async function POST(req: NextRequest) {
  try {
    if (!groqKeyPool.available) {
      return NextResponse.json(
        { error: 'Groq API keys not configured. Add GROQ_API_KEY to .env.local' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // ElevenLabs returns max 25MB which is Groq Whisper's limit
    const fileSizeMB = audioFile.size / (1024 * 1024);
    if (fileSizeMB > 24) {
      return NextResponse.json(
        { error: 'Audio file too large. Max 24MB.' },
        { status: 400 }
      );
    }

    const transcript = await groqKeyPool.call(async (apiKey) => {
      const groq = new Groq({ apiKey });

      const transcription = await groq.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-large-v3',
        language: 'en',
        response_format: 'json',
        temperature: 0,
      });

      return transcription.text;
    });

    return NextResponse.json({ text: transcript?.trim() || '' });
  } catch (error: any) {
    console.error('[Groq Whisper STT] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Transcription failed' },
      { status: 500 }
    );
  }
}

// Next.js App Router handles large multipart uploads automatically.
// No bodyParser config needed (that was a Pages Router concept).
