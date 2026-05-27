# T05: Auth System

## Wave: 1 (depends on T01)

## Dependencies

- **T01** — project scaffolded, `@supabase/auth-helpers-nextjs` installed

## Objective

Implement the single-user authentication lock. Every non-public route must be gated to a single allow-listed email. This is the primary defense against unauthorized access (and unauthorized LLM spend).

## Files to create

```
middleware.ts                    # Next.js middleware — runs on every request
lib/auth/owner-only.ts          # the email-check logic, extracted for reuse
app/(auth)/login/page.tsx        # magic link login page
```

## Implementation

### lib/auth/owner-only.ts

Exports a function that checks whether the current session belongs to the owner:

```typescript
export function isOwner(email: string | undefined): boolean {
  return email === process.env.OWNER_EMAIL;
}
```

Also export a helper for Route Handlers that returns a 403 response if the session user isn't the owner:

```typescript
export async function requireOwner(supabase: SupabaseClient): Promise<{ session: Session } | Response> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isOwner(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
   - If session email !== `OWNER_EMAIL` → return 403
4. For `/(auth)/login`: if already authenticated as owner → redirect to `/`
5. Pass through everything else

Matcher config — apply to all routes except static assets:
```typescript
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### app/(auth)/login/page.tsx

Simple login page with:
- Email input field
- "Send magic link" button
- On submit: call `supabase.auth.signInWithOtp({ email })`
- Success state: "Check your email for the magic link"
- Error state: display error message
- No signup form — this IS the only entry point
- No visible signup CTA, register link, or "create account" option

This is a client component (`'use client'`).

Styling: centered card, minimal, dark-mode-compatible. Use Tailwind only — no shadcn needed for this page.

## Edge cases

- A request from any authenticated non-owner email: 403, not redirect to login
- Expired sessions: middleware refreshes them automatically via `@supabase/auth-helpers-nextjs`
- Direct API hits without cookies: 401

## Skills to reference

- `/project:security-verify` — Part 2 (Single-User Auth): every checkbox in that section maps to a requirement here
- `/project:new-route` — the `requireOwner` helper is used by all Route Handlers
- `/project:scope-check` — no signup form, no registration, no password flow

## Acceptance criteria

- [ ] Unauthenticated request to `/` redirects to `/login`
- [ ] Unauthenticated request to `/api/roadmap` returns 401
- [ ] Login page renders with email input and send button
- [ ] Magic link flow works end-to-end (send OTP, click link, session created)
- [ ] Authenticated owner can access `/(app)/` routes
- [ ] Authenticated non-owner gets 403 on `/(app)/` and `/api/` routes
- [ ] Already-authenticated owner visiting `/login` redirects to `/`
- [ ] No public signup form exists anywhere
- [ ] `OWNER_EMAIL` is read from env vars, never hardcoded
