import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthRoute } from "@/lib/auth/constants";
import { isOwner } from "@/lib/auth/owner-only";

/**
 * Next.js middleware — runs on every matched request.
 *
 * 1. Refreshes the Supabase session (handles token rotation).
 * 2. For /api/* routes: returns 401 (no session) or 403 (non-owner).
 * 3. For public auth pages (/login, /register, /forgot-password): redirects
 *    authenticated owners to /.
 * 4. For /auth/callback: passes through (session established in route handler).
 * 5. For /update-password: requires owner session.
 * 6. For all other routes: redirects to /login if no session, 403 if non-owner.
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  if (pathname === "/auth/callback") {
    return res;
  }

  if (isAuthRoute(pathname)) {
    if (session && isOwner(session.user.email)) {
      const homeUrl = req.nextUrl.clone();
      homeUrl.pathname = "/";
      return NextResponse.redirect(homeUrl);
    }
    return res;
  }

  if (pathname === "/update-password") {
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

  if (pathname.startsWith("/api/")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isOwner(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return res;
  }

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
