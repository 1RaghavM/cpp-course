# GitHub Sync — Design Spec

**Date:** 2026-07-13
**Status:** Approved, ready for implementation plan

## Goal

Let a user connect their GitHub account once, after which every **passed submit**
auto-commits the solution to a dedicated public `cpproad-submissions` repo. Commits
are authored as the user, so they appear on their GitHub contribution graph — the
same behavior as Neetcode.io's GitHub sync.

## How Neetcode does it (investigation summary)

- One-time GitHub account connection at `neetcode.io/profile/github` (OAuth; callback `/api/auth/callback/github`).
- On each submission, the solution is pushed as a commit to a `neetcode-submissions` repo, configurable by status.
- File layout `<topic>/<problem-id>/submission-N.<ext>`, incrementing per resubmission.
- Mechanism (inferred): the **GitHub Contents API** (`PUT /repos/{owner}/{repo}/contents/{path}`) — one authenticated call creates a commit, no local clone. Authenticating as the user makes commits count on their graph.
- Extras we are **not** copying in v1: status filter, bulk backfill, manual per-submission sync/remove.

## Locked decisions

| Decision | Choice |
|---|---|
| Connect method | **GitHub OAuth App** (one-click, non-expiring token) |
| Scope | **`public_repo`** (minimal; creates public repos + writes contents) |
| Target repo | **Auto-create** a dedicated `cpproad-submissions` repo |
| Repo visibility | **Public** |
| v1 sync trigger | Auto-commit **passed submits only** (`mode==='submit' && status==='passed'`) |
| Sync timing | Awaited inline in the submissions route, best-effort (never fails the submit) |

## Architecture

### 1. Connect flow (OAuth App)

One-time operator setup (only the repo owner can do this): register a GitHub OAuth
App, set env vars `GITHUB_OAUTH_CLIENT_ID` and `GITHUB_OAUTH_CLIENT_SECRET`, and set
the app's Authorization callback URL to `<site>/api/github/callback`.

- **`GET /api/github/connect`** (auth required) — generate a random `state`, store it
  in a short-lived httpOnly cookie, redirect to
  `https://github.com/login/oauth/authorize?client_id=…&scope=public_repo&redirect_uri=<site>/api/github/callback&state=<state>`.
- **`GET /api/github/callback`** (auth required) —
  1. Verify `state` against the cookie (CSRF); clear the cookie.
  2. Exchange `code` for an access token:
     `POST https://github.com/login/oauth/access_token` (Accept: application/json).
  3. Fetch the user's login: `GET https://api.github.com/user`.
  4. Ensure the repo exists: `GET /repos/{login}/cpproad-submissions`; on 404,
     `POST /user/repos { name: "cpproad-submissions", private: false, auto_init: true }`
     (`auto_init` guarantees a default branch so the Contents API works immediately).
  5. Encrypt the token (`encryptApiKey`) and upsert the `github_connections` row.
  6. Redirect back to `/dashboard/profile`.

### 2. Data model — new table `github_connections`

Migration `infra/supabase/migrations/016_github_connections.sql`. One row per user.

```sql
create table github_connections (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  github_login    text not null,
  repo_full_name  text not null,          -- e.g. "octocat/cpproad-submissions"
  encrypted_token text not null,          -- ciphertext from encryptApiKey()
  iv              text not null,
  auth_tag        text not null,
  created_at      timestamptz not null default now()
);

alter table github_connections enable row level security;
-- user may read/delete only their own row; no direct insert/update from client
-- (writes happen server-side via the service client in the callback route)
create policy "own row select" on github_connections
  for select using (auth.uid() = user_id);
create policy "own row delete" on github_connections
  for delete using (auth.uid() = user_id);
```

Column names map directly to `EncryptedPayload`: `encrypted_token`=`ciphertext`,
`iv`=`iv`, `auth_tag`=`authTag`. Reuses `lib/crypto/api-keys.ts` +
`API_KEY_ENCRYPTION_SECRET` (no new secret).

### 3. Sync helper — `lib/github/sync.ts`

`syncSubmission({ userId, exerciseId, sourceCode })` called from the submissions
route after a passed submit is stored:

1. Load the user's `github_connections` row (service client). None → return (skip).
2. Decrypt the token.
3. `N` = count of prior passed submits for this `user_id`+`exercise_id` in
   `submissions` → the filename index.
4. Resolve the exercise's lesson (chapter number + lesson slug) and slugify the
   exercise title. Path:
   `ch<NN>-<lesson-slug>/<exercise-title-slug>/submission-N.cpp`.
5. `PUT /repos/{repo_full_name}/contents/{path}` with base64 `sourceCode`, message
   `Solve <exercise title>`. New path each submit → no blob-SHA lookup needed.
6. Wrap the whole thing in try/catch: log failures, never throw.
   `// ponytail: awaited inline; if submit latency bites, move to Next after()/queue.`

### 4. Submissions route change — `app/api/submissions/route.ts`

After the passed-submit row is written, call `syncSubmission(...)`. Failure is
swallowed by the helper, so the submission response is unaffected.

### 5. Settings UI — `components/profile/GithubSyncCard.tsx`

Mirrors the existing `ApiKeyCard` on `/dashboard/profile`. The profile page fetches
the `github_connections` row and passes connection state to the card.

- Not connected → **"Connect GitHub"** button links to `/api/github/connect`.
- Connected → shows `@github_login`, a link to the repo, and a **"Disconnect"**
  button calling **`DELETE /api/github`** (removes the row). Token revocation on the
  GitHub side is optional and skipped in v1.

### 6. Env vars (`.env.example`)

```
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=
# reuses existing API_KEY_ENCRYPTION_SECRET for token encryption
```

## Security notes

- Token stored AES-256-GCM encrypted; only decrypted server-side in `lib/github/sync.ts`.
- `state` cookie prevents OAuth CSRF; callback rejects on mismatch.
- RLS lets a user read/delete only their own connection; token writes go through the
  service client, never the browser.
- Minimal `public_repo` scope, not full `repo`.

## Test that matters

One integration-style check: given a stored `github_connections` row and a mocked
GitHub Contents API, a passed submit produces exactly one `PUT …/contents/…` call at
the expected path, and a GitHub 500 does **not** fail the submission response. No UI
tests.

## Out of scope (v1) — add later, all additive

Status filter (all vs accepted), bulk backfill of past submissions, manual
per-submission sync/remove, private-repo option, on/off toggle.

## Files

**New**
- `infra/supabase/migrations/016_github_connections.sql`
- `app/api/github/connect/route.ts`
- `app/api/github/callback/route.ts`
- `app/api/github/route.ts` (DELETE = disconnect)
- `lib/github/sync.ts`
- `components/profile/GithubSyncCard.tsx`

**Edited**
- `app/api/submissions/route.ts` (call `syncSubmission`)
- `app/dashboard/profile/page.tsx` + `components/profile/ProfilePage.tsx` (fetch state, render card)
- `.env.example`
