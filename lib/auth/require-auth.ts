import { NextResponse } from "next/server";
import type { AuthSession } from "@supabase/supabase-js";
import type { AppSupabaseClient } from "@/lib/supabase/types";

/**
 * Guard for Route Handlers. Returns the session if authenticated,
 * or a 401 JSON response otherwise.
 */
export async function requireAuth(
  supabase: AppSupabaseClient,
): Promise<{ session: AuthSession } | NextResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { session };
}
