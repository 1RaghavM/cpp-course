import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthRoute, isPublicContentRoute } from "@/lib/auth/constants";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  if (pathname === "/auth/callback") {
    return res;
  }

  // Legal pages parked until Google OAuth branding is restored.
  if (pathname === "/privacy" || pathname === "/terms") {
    const dest = req.nextUrl.clone();
    dest.pathname = "/";
    return NextResponse.redirect(dest);
  }

  if (pathname === "/") {
    if (user) {
      const dashboardUrl = req.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      return NextResponse.redirect(dashboardUrl);
    }
    return res;
  }

  if (isPublicContentRoute(pathname)) {
    return res;
  }

  if (isAuthRoute(pathname)) {
    if (user) {
      const dashboardUrl = req.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      return NextResponse.redirect(dashboardUrl);
    }
    return res;
  }

  if (pathname.startsWith("/onboarding")) {
    return res;
  }

  if (pathname === "/update-password") {
    if (!user) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
    return res;
  }

  if (pathname.startsWith("/api/")) {
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return res;
  }

  if (!user) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
