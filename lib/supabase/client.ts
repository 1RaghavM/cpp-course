'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './types';

/**
 * Supabase client for browser-side ('use client') components.
 * Uses only the anon key via NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * The service role key must NEVER be used here.
 */
export function createBrowserClient() {
  return createClientComponentClient<Database>();
}
