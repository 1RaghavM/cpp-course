import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { AppSupabaseClient } from "@/lib/supabase/types";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Guard for Route Handlers. Returns the authenticated user if validated,
 * or a 401 JSON response otherwise.
 *
 * Uses `getUser()` (which verifies the JWT against Supabase Auth) instead of
 * `getSession()` (which only decodes the cookie). This prevents auth bypass
 * via a forged cookie that contains a valid-looking but unverified session.
 */
export async function requireAuth(
  supabase: AppSupabaseClient,
): Promise<{ user: User } | NextResponse> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { user };
}

/** Server Components: authenticated user + Supabase client scoped to the signed-in user. */
export async function requireServerSession(): Promise<{
  supabase: AppSupabaseClient;
  user: User;
  userId: string;
}> {
  const supabase = createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return { supabase, user, userId: user.id };
}
