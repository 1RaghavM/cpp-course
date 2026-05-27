import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isOwner } from "@/lib/auth/owner-only";

/**
 * Exchanges OAuth / magic-link / email-confirmation codes for a session.
 * Non-owner emails are signed out immediately and sent back to login.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, requestUrl.origin));

  if (!code) {
    return redirectTo("/login");
  }

  const supabase = createRouteHandlerClient({ cookies });
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "auth_callback_failed");
    return NextResponse.redirect(loginUrl);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || !isOwner(session.user.email)) {
    await supabase.auth.signOut();
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "forbidden");
    return NextResponse.redirect(loginUrl);
  }

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return redirectTo(safeNext);
}
