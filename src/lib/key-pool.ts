/**
 * Gemini API Key Pool with automatic rotation.
 *
 * When one key hits a rate limit (429) or quota error, the next key
 * is tried automatically. Cycles through all available keys before giving up.
 *
 * Usage:
 *   import { geminiKeyPool } from '@/lib/key-pool';
 *   const result = await geminiKeyPool.call(async (genAI) => {
 *     const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
 *     return await model.generateContent(...);
 *   });
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Collect all keys from env — filter out empty ones
const RAW_KEYS: string[] = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
  ...Object.keys(process.env)
    .filter((k) => k.startsWith('GEMINI_API_KEY_') && !['GEMINI_API_KEY_2', 'GEMINI_API_KEY_3', 'GEMINI_API_KEY_4', 'GEMINI_API_KEY_5'].includes(k))
    .map((k) => process.env[k]),
].filter((k): k is string => typeof k === 'string' && k.trim().length > 10);

if (RAW_KEYS.length === 0) {
  console.warn('[KeyPool] No Gemini API keys configured. Set GEMINI_API_KEY in .env.local');
}

// Errors that mean this key is exhausted / rate-limited → try next key
const ROTATION_TRIGGERS = [
  'quota',
  'rate',
  'limit',
  '429',
  'resource_exhausted',
  'RESOURCE_EXHAUSTED',
  'too many requests',
  'exceeded',
  'billing',
  'api key expired',
  'api_key_invalid',
  'not found',
  '404',
];

function isRotatableError(err: any): boolean {
  const msg = String(err?.message || err?.status || err || '').toLowerCase();
  return ROTATION_TRIGGERS.some((t) => msg.includes(t.toLowerCase()));
}

class GeminiKeyPool {
  private keys: string[];
  private clients: GoogleGenerativeAI[];
  /** Track per-key error counts (reset after 60s) */
  private keyErrorCount: number[];
  private keyLastError: number[];

  constructor(keys: string[]) {
    this.keys = keys;
    this.clients = keys.map((k) => new GoogleGenerativeAI(k));
    this.keyErrorCount = keys.map(() => 0);
    this.keyLastError = keys.map(() => 0);
  }

  /** Returns true if the key pool has at least one key */
  get available(): boolean {
    return this.keys.length > 0;
  }

  /** Number of keys in the pool */
  get count(): number {
    return this.keys.length;
  }

  /**
   * Execute `fn` with each available GenAI client.
   * On rate-limit/quota errors, rotates to the next key automatically.
   * Throws only when ALL keys fail.
   */
  async call<T>(fn: (genAI: GoogleGenerativeAI, keyIndex: number) => Promise<T>): Promise<T> {
    if (this.keys.length === 0) {
      throw new Error('No Gemini API keys configured. Add GEMINI_API_KEY to .env.local');
    }

    const now = Date.now();
    let lastError: any;

    for (let i = 0; i < this.keys.length; i++) {
      const client = this.clients[i];
      const keyShort = this.keys[i].slice(-8); // last 8 chars for logging

      // Skip keys with recent consecutive failures (back off 60s)
      if (this.keyErrorCount[i] >= 3 && now - this.keyLastError[i] < 60_000) {
        console.warn(`[KeyPool] Skipping key ...${keyShort} (backed off, ${this.keyErrorCount[i]} errors)`);
        continue;
      }

      try {
        const result = await fn(client, i);
        // Success → reset error count for this key
        this.keyErrorCount[i] = 0;
        console.log(`[KeyPool] Success with key ...${keyShort}`);
        return result;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err || '');
        console.warn(`[KeyPool] Key ...${keyShort} failed: ${msg.slice(0, 100)}`);

        if (isRotatableError(err)) {
          this.keyErrorCount[i]++;
          this.keyLastError[i] = now;
          console.warn(`[KeyPool] Rate/quota error on key ...${keyShort}, rotating to next key (attempt ${i + 1}/${this.keys.length})`);
          continue; // try next key
        } else {
          // Non-quota error (bad prompt, model error) — don't rotate, just throw
          throw err;
        }
      }
    }

    throw new Error(
      `All ${this.keys.length} Gemini API keys exhausted or rate-limited. Last error: ${lastError?.message || lastError}`
    );
  }

  /**
   * Simple helper: get a generative model trying each key until one works.
   * Used for simple single-shot completions.
   */
  async generateWithFallback(
    modelNames: string[],
    getContents: (genAI: GoogleGenerativeAI) => any,
    systemInstruction?: string,
    generationConfig?: Record<string, any>
  ): Promise<string> {
    return this.call(async (genAI) => {
      for (const modelName of modelNames) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            ...(systemInstruction ? { systemInstruction } : {}),
            ...(generationConfig ? { generationConfig } : {}),
          });
          const result = await model.generateContent(getContents(genAI));
          const text = result.response.text().trim();
          if (text && text.length > 5) return text;
        } catch (e: any) {
          // If it's a model-not-found error, try next model
          const msg = String(e?.message || '').toLowerCase();
          if (msg.includes('not found') || msg.includes('not supported') || msg.includes('model')) {
            console.warn(`[KeyPool] Model ${modelName} unavailable, trying next model`);
            continue;
          }
          throw e; // let the outer key-rotation handle rate limits
        }
      }
      throw new Error('All model variants exhausted without a valid response');
    });
  }
}

// Singleton pool — shared across all API routes in this server process
export const geminiKeyPool = new GeminiKeyPool(RAW_KEYS);

// Also export the raw key list for direct use
export const GEMINI_KEYS = RAW_KEYS;

// Convenience: get the first available key (for simple use cases)
export const PRIMARY_GEMINI_KEY = RAW_KEYS[0] || '';
