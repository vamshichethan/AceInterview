import { NextResponse } from 'next/server';

/**
 * /api/interviewer/talk
 *
 * High-fidelity Indian English (en-IN) voice synthesis for the AI Interviewer (Aarav Sharma / Priya Patel).
 * Automatically strips code blocks & markdown artifacts from speech,
 * breaks into natural spoken phrases, synthesizes authentic Indian accent audio,
 * and seamlessly concatenates audio into MP3.
 */

// Known foreign default voices that should NOT be used if user wants Indian voice
const FOREIGN_VOICE_IDS = new Set([
  'pNInz6obpgDQGcFmaJgB', // Adam (American)
  '21m00Tcm4TlvDq8ikWAM', // Rachel (American)
]);

interface TalkRequest {
  text: string;
  persona?: 'alex' | 'sophia';
}

function cleanSpokenText(text: string): string {
  return text
    // Replace full code blocks with a brief conversational phrase so interviewer doesn't recite syntax
    .replace(/```[a-zA-Z]*\n([\s\S]*?)\n```/g, ' as shown in the code editor ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*#_~>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitTextIntoChunks(text: string, maxLen = 170): string[] {
  const clean = cleanSpokenText(text);
  if (!clean) return [];

  const sentenceRegex = /[^.!?\n]+(?:[.!?\n]+|$)/g;
  const rawSentences = clean.match(sentenceRegex) || [clean];

  const chunks: string[] = [];
  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (trimmed.length <= maxLen) {
      chunks.push(trimmed);
    } else {
      const words = trimmed.split(' ');
      let cur = '';
      for (const w of words) {
        if ((cur + ' ' + w).length > maxLen) {
          if (cur.trim()) chunks.push(cur.trim());
          cur = w;
        } else {
          cur = cur ? cur + ' ' + w : w;
        }
      }
      if (cur.trim()) chunks.push(cur.trim());
    }
  }
  return chunks;
}

async function synthesizeIndianSpeech(text: string): Promise<string> {
  const chunks = splitTextIntoChunks(text);
  if (chunks.length === 0) {
    throw new Error('No readable text to synthesize');
  }

  const audioBuffers: Buffer[] = [];

  // Synthesize chunks in order with authentic Indian English accent (en-IN)
  for (const chunk of chunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en-IN&client=tw-ob&ttsspeed=1&q=${encodeURIComponent(
      chunk
    )}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      throw new Error(`Indian voice synthesis HTTP ${res.status}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    audioBuffers.push(Buffer.from(arrayBuffer));
  }

  const combined = Buffer.concat(audioBuffers);
  return combined.toString('base64');
}

export async function POST(req: Request) {
  try {
    const body: TalkRequest = await req.json();
    const { text, persona = 'alex' } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const customIndianVoiceId =
      persona === 'sophia'
        ? process.env.ELEVENLABS_VOICE_INDIAN_FEMALE || process.env.ELEVENLABS_VOICE_SOPHIA
        : process.env.ELEVENLABS_VOICE_INDIAN_MALE || process.env.ELEVENLABS_VOICE_ALEX;

    const apiKey = process.env.ELEVENLABS_API_KEY;

    // Only attempt ElevenLabs if the user configured a custom/cloned Indian voice ID (not default Adam/Rachel)
    const hasCustomIndianElevenLabsVoice =
      apiKey &&
      customIndianVoiceId &&
      !FOREIGN_VOICE_IDS.has(customIndianVoiceId) &&
      customIndianVoiceId !== 'pNInz6obpgDQGcFmaJgB' &&
      customIndianVoiceId !== '21m00Tcm4TlvDq8ikWAM';

    if (hasCustomIndianElevenLabsVoice) {
      try {
        const cleanForElevenLabs = cleanSpokenText(text).slice(0, 2500);
        const ttsRes = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${customIndianVoiceId}`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': apiKey,
              'Content-Type': 'application/json',
              Accept: 'audio/mpeg',
            },
            body: JSON.stringify({
              text: cleanForElevenLabs,
              model_id: 'eleven_multilingual_v2',
              voice_settings: {
                stability: 0.55,
                similarity_boost: 0.8,
                style: 0.25,
                use_speaker_boost: true,
              },
            }),
          }
        );

        if (ttsRes.ok) {
          const audioBuffer = await ttsRes.arrayBuffer();
          const base64Audio = Buffer.from(audioBuffer).toString('base64');
          return NextResponse.json({
            success: true,
            audioBase64: base64Audio,
            mimeType: 'audio/mpeg',
            voiceType: 'elevenlabs-indian',
            persona,
          });
        }
        console.warn(
          '[ElevenLabs Custom Voice]',
          ttsRes.status,
          'Falling back to authentic en-IN Indian voice synthesis'
        );
      } catch (elError) {
        console.warn('[ElevenLabs Custom Voice Error]', elError);
      }
    }

    // Generate authentic Indian English voice audio (en-IN)
    try {
      const base64Audio = await synthesizeIndianSpeech(text);
      return NextResponse.json({
        success: true,
        audioBase64: base64Audio,
        mimeType: 'audio/mpeg',
        voiceType: 'indian-en-in',
        persona,
      });
    } catch (synthError) {
      console.error('[Indian Voice Synthesis Error]', synthError);
      return NextResponse.json(
        {
          error: 'Indian voice synthesis failed, falling back to browser en-IN voice',
          fallbackToBrowserTTS: true,
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('[Interviewer Talk API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: error?.message || 'TTS generation failed',
        fallbackToBrowserTTS: true,
      },
      { status: 500 }
    );
  }
}

