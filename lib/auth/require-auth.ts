import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import type { AuthSession } from "@supabase/supabase-js";
import type { AppSupabaseClient } from "@/lib/supabase/types";
import { createServerClient } from "@/lib/supabase/server";

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

/** Server Components: session + Supabase client scoped to the signed-in user. */
export async function requireServerSession(): Promise<{
  supabase: AppSupabaseClient;
  session: AuthSession;
  userId: string;
}> {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return { supabase, session, userId: session.user.id };
}
