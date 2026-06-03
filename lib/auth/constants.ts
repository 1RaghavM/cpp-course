export const AUTH_ROUTES = ["/login", "/register", "/forgot-password"] as const;

/** Post-recovery password set; requires an active session. */
export const UPDATE_PASSWORD_ROUTE = "/update-password";

export type AuthRoute = (typeof AUTH_ROUTES)[number];

export function isAuthRoute(pathname: string): pathname is AuthRoute {
  return (AUTH_ROUTES as readonly string[]).includes(pathname);
}

/** Redirect target after email confirmation or password reset. */
export function authCallbackUrl(origin: string, next?: string): string {
  const base = `${origin}/auth/callback`;
  if (!next) return base;
  return `${base}?next=${encodeURIComponent(next)}`;
}
