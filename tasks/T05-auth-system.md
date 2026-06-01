# T05: Auth System

## Wave: 1 (depends on T01)

## Dependencies

- **T01** — project scaffolded, `@supabase/auth-helpers-nextjs` installed

## Objective

Implement authentication. Every non-public route must require a valid session. This is the primary defense against unauthorized access (and unauthorized LLM spend).

## Files to create

```
middleware.ts                    # Next.js middleware — runs on every request
lib/auth/require-auth.ts        # the session-check logic, extracted for reuse
app/(auth)/login/page.tsx        # magic link login/signup page
```

## Implementation

### lib/auth/require-auth.ts

Exports a helper for Route Handlers that returns a 401 response if no valid session exists:

```typescript
export async function requireAuth(supabase: SupabaseClient): Promise<{ session: Session } | Response> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return { session };
}
```

### middleware.ts

Next.js middleware that runs on every request. Uses `@supabase/auth-helpers-nextjs` middleware utilities.

Logic:
1. Create a Supabase middleware client
2. Refresh the session (handles token rotation)
3. For routes under `/(app)/` and `/api/` (but NOT `/(auth)/`):
   - If no session → redirect to `/login`
4. For `/(auth)/login`: if already authenticated → redirect to `/`
5. Pass through everything else

Matcher config — apply to all routes except static assets:
```typescript
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### app/(auth)/login/page.tsx

Simple login/signup page with:
- Email input field
- "Send magic link" button
- On submit: call `supabase.auth.signInWithOtp({ email })`
- Success state: "Check your email for the magic link"
- Error state: display error message
- Works for both new and existing users (magic link handles both signup and login)

This is a client component (`'use client'`).

Styling: centered card, minimal, dark-mode-compatible. Use Tailwind only — no shadcn needed for this page.

## Edge cases

- Expired sessions: middleware refreshes them automatically via `@supabase/auth-helpers-nextjs`
- Direct API hits without cookies: 401
- New user signs up: session is created, RLS ensures they start with clean state

## Skills to reference

- `/project:security-verify` — Part 2 (Authentication & User Isolation): every checkbox in that section maps to a requirement here
- `/project:new-route` — the `requireAuth` helper is used by all Route Handlers

## Acceptance criteria

- [ ] Unauthenticated request to `/` redirects to `/login`
- [ ] Unauthenticated request to `/api/roadmap` returns 401
- [ ] Login page renders with email input and send button
- [ ] Magic link flow works end-to-end for new users (signup) and existing users (login)
- [ ] Authenticated user can access `/(app)/` routes
- [ ] Already-authenticated user visiting `/login` redirects to `/`
- [ ] Per-user RLS ensures data isolation between users
