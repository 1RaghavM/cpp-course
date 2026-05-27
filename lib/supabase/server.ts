import { createRouteHandlerClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
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
