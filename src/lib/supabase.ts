import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Support both ANON and PUBLISHABLE key naming
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project') &&
    !supabaseAnonKey.includes('your-anon-key')
  );
};

// Client-side Supabase client (uses anon/publishable key)
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false, // We manage sessions ourselves via HttpOnly cookies
        autoRefreshToken: false,
      },
    })
  : null;

// Server-side Supabase client (uses service role key — bypass RLS)
// Only use in API routes, never expose to the browser
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

export const supabaseAdmin: SupabaseClient | null =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;
