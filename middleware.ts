import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isOwner } from "@/lib/auth/owner-only";

/**
 * Next.js middleware — runs on every matched request.
 *
 * Route groups like (app) and (auth) are stripped from URLs by Next.js, so the
 * middleware sees the resolved pathname (e.g. "/" not "/(app)").
 *
 * 1. Refreshes the Supabase session (handles token rotation).
 * 2. For /api/* routes: returns 401 (no session) or 403 (non-owner).
 * 3. For /login: redirects authenticated owner to /.
 * 4. For all other routes (the app shell): redirects to /login if no session,
 *    returns 403 if the session email is not the owner.
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh the session — this also sets/rotates cookies on `res`.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // ---- Auth route: /login ----
  if (pathname === "/login") {
    // Already authenticated as owner → redirect home.
    if (session && isOwner(session.user.email)) {
      const homeUrl = req.nextUrl.clone();
      homeUrl.pathname = "/";
      return NextResponse.redirect(homeUrl);
    }
    // Not authenticated or not owner — allow through to the login page.
    return res;
  }

  // ---- API routes ----
  if (pathname.startsWith("/api/")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isOwner(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return res;
  }

  // ---- All other routes (the app shell under /(app)/) ----
  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (!isOwner(session.user.email)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
