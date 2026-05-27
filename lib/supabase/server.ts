import { createRouteHandlerClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './types';

/**
 * Typed Supabase client alias for function signatures.
 */
export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Supabase client for Route Handlers (app/api/…/route.ts).
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from env.
 */
export function createRouteClient(): TypedSupabaseClient {
  return createRouteHandlerClient<Database>({ cookies }) as unknown as TypedSupabaseClient;
}

/**
 * Supabase client for Server Components (app/…/page.tsx rendered on server).
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from env.
 */
export function createServerClient(): TypedSupabaseClient {
  return createServerComponentClient<Database>({ cookies }) as unknown as TypedSupabaseClient;
}

/**
 * Service role client for privileged server-side operations that need to bypass RLS.
 * Use ONLY for system operations like content generation, NOT for user-initiated queries.
 * Requires SUPABASE_SERVICE_ROLE_KEY env var.
 */
export function createServiceClient(): TypedSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
    },
  });
}
