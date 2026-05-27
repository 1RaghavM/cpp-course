import { NextResponse } from "next/server";
import type { AuthSession } from "@supabase/supabase-js";
import type { AppSupabaseClient } from "@/lib/supabase/types";

/**
 * Check whether the given email matches the single allowed owner.
 */
export function isOwner(email: string | undefined): boolean {
  const allowed = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (!allowed || !email) return false;
  return email.trim().toLowerCase() === allowed;
}

/**
 * Guard for Route Handlers. Returns the session if the caller is the owner,
 * or a 401/403 JSON response otherwise.
 *
 * Usage in a Route Handler:
 * ```ts
 * const result = await requireOwner(supabase);
 * if (result instanceof Response) return result;
 * const { session } = result;
 * ```
 */
export async function requireOwner(
  supabase: AppSupabaseClient,
): Promise<{ session: AuthSession } | NextResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isOwner(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { session };
}
