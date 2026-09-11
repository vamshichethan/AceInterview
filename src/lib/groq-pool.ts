/**
 * Groq API Key Pool with automatic rotation.
 *
 * Groq is used for:
 *  1. Whisper-large-v3 — ultra-accurate speech-to-text transcription
 *  2. LLaMA / Mixtral — fast LLM fallback when Gemini is rate-limited
 *
 * Key rotation logic: Try key 1 → if 429/rate-limit → rotate to key 2.
 * Keys reset after 60s backoff window.
 */

const GROQ_RAW_KEYS: string[] = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
].filter((k): k is string => typeof k === 'string' && k.trim().length > 10);

if (GROQ_RAW_KEYS.length === 0) {
  console.warn('[GroqPool] No Groq API keys configured. Add GROQ_API_KEY to .env.local');
}

const GROQ_ROTATION_TRIGGERS = [
  'rate_limit_exceeded',
  'rate limit',
  '429',
  'too_many_requests',
  'quota',
  'exceeded',
  'tokens per',
  'requests per',
];

function isGroqRotatableError(err: any): boolean {
  const msg = String(err?.message || err?.error?.message || err?.status || err || '').toLowerCase();
  return GROQ_ROTATION_TRIGGERS.some((t) => msg.includes(t.toLowerCase()));
}

class GroqKeyPool {
  private keys: string[];
  private keyErrorCount: number[];
  private keyLastError: number[];

  constructor(keys: string[]) {
    this.keys = keys;
    this.keyErrorCount = keys.map(() => 0);
    this.keyLastError = keys.map(() => 0);
  }

  get available(): boolean {
    return this.keys.length > 0;
  }

  get count(): number {
    return this.keys.length;
  }

  /** Get current active key (first non-backed-off key) */
  getActiveKey(): string {
    if (this.keys.length === 0) throw new Error('No Groq API keys configured');
    const now = Date.now();
    for (let i = 0; i < this.keys.length; i++) {
      if (this.keyErrorCount[i] < 3 || now - this.keyLastError[i] >= 60_000) {
        return this.keys[i];
      }
    }
    // All backed off — return first key anyway (expired backoff)
    this.keyErrorCount[0] = 0;
    return this.keys[0];
  }

  /**
   * Execute an async function using Groq keys with auto-rotation.
   * The callback receives the API key string to use with the Groq SDK.
   */
  async call<T>(fn: (apiKey: string, keyIndex: number) => Promise<T>): Promise<T> {
    if (this.keys.length === 0) {
      throw new Error('No Groq API keys configured. Add GROQ_API_KEY to .env.local');
    }

    const now = Date.now();
    let lastError: any;

    for (let i = 0; i < this.keys.length; i++) {
      const key = this.keys[i];
      const keyShort = key.slice(-8);

      if (this.keyErrorCount[i] >= 3 && now - this.keyLastError[i] < 60_000) {
        console.warn(`[GroqPool] Skipping key ...${keyShort} (backed off)`);
        continue;
      }

      try {
        const result = await fn(key, i);
        this.keyErrorCount[i] = 0;
        console.log(`[GroqPool] Success with key ...${keyShort}`);
        return result;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err || '');
        console.warn(`[GroqPool] Key ...${keyShort} failed: ${msg.slice(0, 120)}`);

        if (isGroqRotatableError(err)) {
          this.keyErrorCount[i]++;
          this.keyLastError[i] = Date.now();
          console.warn(`[GroqPool] Rate limit on key ...${keyShort}, rotating (${i + 1}/${this.keys.length})`);
          continue;
        } else {
          throw err;
        }
      }
    }

    throw new Error(
      `All ${this.keys.length} Groq API keys exhausted. Last error: ${lastError?.message || lastError}`
    );
  }
}

export const groqKeyPool = new GroqKeyPool(GROQ_RAW_KEYS);
export const GROQ_KEYS = GROQ_RAW_KEYS;
export const PRIMARY_GROQ_KEY = GROQ_RAW_KEYS[0] || '';
