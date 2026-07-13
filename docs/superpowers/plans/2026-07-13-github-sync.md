# GitHub Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user connect GitHub once, then every passed submit auto-commits the solution to their public `cpproad-submissions` repo (commits land on their contribution graph), like Neetcode.

**Architecture:** GitHub OAuth App → non-expiring token stored AES-256-GCM-encrypted in a new `github_connections` table. On a passed submit, the submissions route awaits a best-effort `syncSubmission` helper that PUTs the file via the GitHub Contents API (one authenticated call = one commit). A profile card starts/ends the connection.

**Tech Stack:** Next.js 14 App Router (Route Handlers), Supabase (Postgres + RLS), Node `crypto` (existing `lib/crypto/api-keys.ts`), GitHub REST API, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-13-github-sync-design.md`

**Reference patterns (read before starting):**
- Route + encrypt/store pattern: `app/api/profile/api-key/route.ts`
- Settings card pattern: `components/profile/ApiKeyCard.tsx` + `components/profile/ProfilePage.tsx` + `app/dashboard/profile/page.tsx`
- Supabase clients: `lib/supabase/server.ts` (`createRouteClient`, `createServiceClient`)
- Crypto: `lib/crypto/api-keys.ts` (`encryptApiKey` → `{ciphertext, iv, authTag}`, `decryptApiKey`)
- OAuth callback style: `app/auth/callback/route.ts`
- Migration + RLS style: `infra/supabase/migrations/014_user_api_keys.sql`

**Testing note:** Per the project's testing strategy, only `lib/github/*` logic gets unit tests (Vitest, `__tests__/`). Routes and UI are verified by typecheck/lint/build + manual check — the repo does not test API routes or UI components.

---

## Task 1: Database migration + regenerated types

**Files:**
- Create: `infra/supabase/migrations/016_github_connections.sql`
- Modify: `lib/supabase/types.ts` (regenerate)

- [ ] **Step 1: Write the migration**

Create `infra/supabase/migrations/016_github_connections.sql`:

```sql
-- 016_github_connections.sql
-- One GitHub OAuth connection per user for submission mirroring.
-- Token stored AES-256-GCM encrypted (see lib/crypto/api-keys.ts).

CREATE TABLE github_connections (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_login    TEXT NOT NULL,
  repo_full_name  TEXT NOT NULL,          -- e.g. "octocat/cpproad-submissions"
  encrypted_token TEXT NOT NULL,          -- ciphertext from encryptApiKey()
  iv              TEXT NOT NULL,
  auth_tag        TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;

-- User may read/delete only their own row. Inserts/updates happen server-side
-- via the service-role client in the OAuth callback (bypasses RLS), never the browser.
CREATE POLICY "own connection select" ON github_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own connection delete" ON github_connections
  FOR DELETE USING (auth.uid() = user_id);
```

- [ ] **Step 2: Apply the migration**

Run: `npx supabase db push`
Expected: migration `016_github_connections` applied, no errors.

- [ ] **Step 3: Regenerate types**

Run: `npx supabase gen types typescript --local > lib/supabase/types.ts`
Expected: `lib/supabase/types.ts` now contains a `github_connections` table type.

> **Fallback if local Supabase isn't running:** manually add this to the `Tables` object in `lib/supabase/types.ts` (mirror the shape of the existing `user_api_keys` entry):
> ```ts
> github_connections: {
>   Row: { user_id: string; github_login: string; repo_full_name: string; encrypted_token: string; iv: string; auth_tag: string; created_at: string };
>   Insert: { user_id: string; github_login: string; repo_full_name: string; encrypted_token: string; iv: string; auth_tag: string; created_at?: string };
>   Update: { user_id?: string; github_login?: string; repo_full_name?: string; encrypted_token?: string; iv?: string; auth_tag?: string; created_at?: string };
>   Relationships: [];
> };
> ```

- [ ] **Step 4: Commit**

```bash
git add infra/supabase/migrations/016_github_connections.sql lib/supabase/types.ts
git commit -m "feat(db): add github_connections table for GitHub sync"
```

---

## Task 2: GitHub REST client (`lib/github/client.ts`)

Thin wrappers over the GitHub API: token exchange, get login, ensure repo, put file. Pure HTTP — the only I/O is `fetch`, so it is testable with a mocked `fetch`.

**Files:**
- Create: `lib/github/client.ts`
- Test: `__tests__/github/client.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/github/client.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { putFile } from "@/lib/github/client";

afterEach(() => vi.restoreAllMocks());

describe("putFile", () => {
  it("PUTs base64 content to the Contents API and encodes path segments", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 201 }));

    await putFile("tok", "octo/cpproad-submissions", "1.5-vars/two sum/submission-0.cpp", "int main(){}", "Solve Two Sum");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      "https://api.github.com/repos/octo/cpproad-submissions/contents/1.5-vars/two%20sum/submission-0.cpp",
    );
    expect(init?.method).toBe("PUT");
    const body = JSON.parse(init!.body as string);
    expect(body.message).toBe("Solve Two Sum");
    expect(Buffer.from(body.content, "base64").toString("utf8")).toBe("int main(){}");
    expect((init!.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("throws on a non-ok GitHub response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("boom", { status: 500 }));
    await expect(
      putFile("tok", "octo/repo", "a/b.cpp", "x", "msg"),
    ).rejects.toThrow(/500/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/github/client.test.ts`
Expected: FAIL — cannot find module `@/lib/github/client`.

- [ ] **Step 3: Write the implementation**

Create `lib/github/client.ts`:

```ts
const GITHUB_API = "https://api.github.com";

function ghFetch(token: string, path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

/** Keep the "/" separators but percent-encode each path segment. */
function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

/** Exchange an OAuth `code` for a (non-expiring) user access token. */
export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      code,
    }),
  });
  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(`GitHub token exchange failed: ${data.error ?? "no access_token"}`);
  }
  return data.access_token;
}

/** Return the authenticated user's GitHub login. */
export async function getGithubLogin(token: string): Promise<string> {
  const res = await ghFetch(token, "/user");
  if (!res.ok) throw new Error(`GitHub /user failed: ${res.status}`);
  const data = (await res.json()) as { login: string };
  return data.login;
}

/** Ensure `<login>/<repo>` exists (public, auto-initialized). Returns its full name. */
export async function ensureRepo(token: string, login: string, repo: string): Promise<string> {
  const check = await ghFetch(token, `/repos/${login}/${repo}`);
  if (check.ok) return `${login}/${repo}`;
  if (check.status !== 404) throw new Error(`GitHub repo check failed: ${check.status}`);

  const create = await ghFetch(token, "/user/repos", {
    method: "POST",
    body: JSON.stringify({
      name: repo,
      private: false,
      auto_init: true,
      description: "My cpproad C++ solutions",
    }),
  });
  if (!create.ok) throw new Error(`GitHub repo create failed: ${create.status}`);
  return `${login}/${repo}`;
}

/** Create/overwrite a file via the Contents API — one call creates one commit. */
export async function putFile(
  token: string,
  repoFullName: string,
  path: string,
  content: string,
  message: string,
): Promise<void> {
  const res = await ghFetch(token, `/repos/${repoFullName}/contents/${encodePath(path)}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
    }),
  });
  if (!res.ok) throw new Error(`GitHub putFile failed: ${res.status}`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/github/client.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/github/client.ts __tests__/github/client.test.ts
git commit -m "feat(github): add GitHub REST client (token exchange, repo, contents)"
```

---

## Task 3: Sync helper (`lib/github/sync.ts`)

Orchestration: load the connection, compute the file path + submission index, decrypt the token, PUT the file. Everything wrapped in try/catch so a GitHub failure never propagates. Path-building is a pure exported function so it can be tested directly.

**Files:**
- Create: `lib/github/sync.ts`
- Test: `__tests__/github/sync.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/github/sync.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mock the three I/O dependencies of sync.ts -----------------------------
const putFile = vi.fn();
vi.mock("@/lib/github/client", () => ({ putFile: (...a: unknown[]) => putFile(...a) }));
vi.mock("@/lib/crypto/api-keys", () => ({ decryptApiKey: () => "decrypted-token" }));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createServiceClient: () => ({ from: fromMock }) }));

import { buildSubmissionPath, syncSubmission } from "@/lib/github/sync";

/** Minimal chainable Supabase stub: `.single()` resolves data; awaiting resolves { count }. */
function tableStub(opts: { single?: unknown; count?: number }) {
  const stub: Record<string, unknown> = {};
  for (const m of ["select", "eq", "order", "limit"]) stub[m] = () => stub;
  stub.single = () => Promise.resolve({ data: opts.single ?? null, error: null });
  stub.then = (resolve: (v: unknown) => void) => resolve({ count: opts.count ?? 0, error: null });
  return stub;
}

const CONN = {
  github_login: "octo",
  repo_full_name: "octo/cpproad-submissions",
  encrypted_token: "c",
  iv: "i",
  auth_tag: "t",
};
const EX = { title: "Two Sum", lessons: { number: "1.5", slug: "vars" } };

beforeEach(() => {
  putFile.mockReset();
  fromMock.mockReset();
  fromMock.mockImplementation((table: string) => {
    if (table === "github_connections") return tableStub({ single: CONN });
    if (table === "exercises") return tableStub({ single: EX });
    if (table === "submissions") return tableStub({ count: 1 }); // this passed submit is row #1 → index 0
    throw new Error(`unexpected table ${table}`);
  });
});

describe("buildSubmissionPath", () => {
  it("groups by lesson, slugifies the exercise title, indexes the file", () => {
    expect(buildSubmissionPath("1.5", "vars", "Two Sum!", 0)).toBe(
      "1.5-vars/two-sum/submission-0.cpp",
    );
  });
});

describe("syncSubmission", () => {
  it("PUTs the solution to the expected path", async () => {
    await syncSubmission({ userId: "u1", exerciseId: "e1", sourceCode: "int main(){}" });
    expect(putFile).toHaveBeenCalledTimes(1);
    expect(putFile).toHaveBeenCalledWith(
      "decrypted-token",
      "octo/cpproad-submissions",
      "1.5-vars/two-sum/submission-0.cpp",
      "int main(){}",
      "Solve Two Sum",
    );
  });

  it("swallows a GitHub failure (never throws)", async () => {
    putFile.mockRejectedValueOnce(new Error("GitHub putFile failed: 500"));
    await expect(
      syncSubmission({ userId: "u1", exerciseId: "e1", sourceCode: "x" }),
    ).resolves.toBeUndefined();
    expect(putFile).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the user has no connection", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "github_connections") return tableStub({ single: null });
      return tableStub({});
    });
    await syncSubmission({ userId: "u1", exerciseId: "e1", sourceCode: "x" });
    expect(putFile).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/github/sync.test.ts`
Expected: FAIL — cannot find module `@/lib/github/sync`.

- [ ] **Step 3: Write the implementation**

Create `lib/github/sync.ts`:

```ts
import { createServiceClient } from "@/lib/supabase/server";
import { decryptApiKey } from "@/lib/crypto/api-keys";
import { putFile } from "@/lib/github/client";

const REPO_NAME = "cpproad-submissions";

/** kebab-case a title for use as a path segment. */
export function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || "untitled";
}

/** `<lessonNumber>-<lessonSlug>/<exercise-slug>/submission-<n>.cpp` */
export function buildSubmissionPath(
  lessonNumber: string,
  lessonSlug: string,
  exerciseTitle: string,
  n: number,
): string {
  return `${lessonNumber}-${lessonSlug}/${slugify(exerciseTitle)}/submission-${n}.cpp`;
}

interface SyncArgs {
  userId: string;
  exerciseId: string;
  sourceCode: string;
}

/**
 * Best-effort mirror of a passed submission to the user's GitHub repo.
 * Assumes the submission row is ALREADY stored. Never throws — a GitHub
 * failure is logged and swallowed so it cannot break the submit response.
 */
export async function syncSubmission({ userId, exerciseId, sourceCode }: SyncArgs): Promise<void> {
  try {
    const svc = createServiceClient();

    const { data: conn } = await svc
      .from("github_connections")
      .select("github_login, repo_full_name, encrypted_token, iv, auth_tag")
      .eq("user_id", userId)
      .single();
    if (!conn) return; // user hasn't connected GitHub

    const { data: ex } = await svc
      .from("exercises")
      .select("title, lessons(number, slug)")
      .eq("id", exerciseId)
      .single();
    if (!ex) return;

    const lesson = (ex as { lessons: { number: string; slug: string } | null }).lessons;
    if (!lesson) return;

    // This passed submit is already stored, so count includes it → index = count - 1.
    const { count } = await svc
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("exercise_id", exerciseId)
      .eq("mode", "submit")
      .eq("status", "passed");
    const n = Math.max(0, (count ?? 1) - 1);

    const path = buildSubmissionPath(lesson.number, lesson.slug, (ex as { title: string }).title, n);
    const token = decryptApiKey({
      ciphertext: conn.encrypted_token,
      iv: conn.iv,
      authTag: conn.auth_tag,
    });

    await putFile(token, conn.repo_full_name, path, sourceCode, `Solve ${(ex as { title: string }).title}`);
  } catch (err) {
    // ponytail: awaited inline in the submit route; if latency bites, move to Next after()/queue.
    console.error("[github-sync] failed:", err instanceof Error ? err.message : err);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/github/sync.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/github/sync.ts __tests__/github/sync.test.ts
git commit -m "feat(github): add best-effort syncSubmission helper"
```

---

## Task 4: Wire sync into the submissions route

**Files:**
- Modify: `app/api/submissions/route.ts` (add import; call sync after the passed-submit block, ~line 278)

- [ ] **Step 1: Add the import**

At the top of `app/api/submissions/route.ts`, after the `logExecutionTimeout` import block (line 17), add:

```ts
import { syncSubmission } from "@/lib/github/sync";
```

- [ ] **Step 2: Call the helper after the lesson-completed block**

In the `submit` branch, immediately after the `if (verdict.overallStatus === "passed") { … lessonCompleted upsert … }` block (ends ~line 278) and before the `// ---- Statsig events` comment (line 280), insert:

```ts
  // ---- GitHub sync (best-effort; helper swallows all errors) ---------------
  if (verdict.overallStatus === "passed") {
    await syncSubmission({ userId, exerciseId: exercise_id, sourceCode: source_code });
  }
```

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 4: Verify existing tests still pass**

Run: `npx vitest run`
Expected: PASS (all suites, including the two new github suites).

- [ ] **Step 5: Commit**

```bash
git add app/api/submissions/route.ts
git commit -m "feat(submissions): mirror passed submits to GitHub"
```

---

## Task 5: OAuth connect route

Starts the OAuth flow: stores a CSRF `state` cookie and redirects to GitHub's authorize page with the minimal `public_repo` scope.

**Files:**
- Create: `app/api/github/connect/route.ts`

- [ ] **Step 1: Write the route**

Create `app/api/github/connect/route.ts`:

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GitHub OAuth is not configured" }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const state = randomBytes(16).toString("hex");

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("scope", "public_repo");
  authorize.searchParams.set("redirect_uri", `${origin}/api/github/callback`);
  authorize.searchParams.set("state", state);

  const res = NextResponse.redirect(authorize);
  res.cookies.set("gh_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/github/connect/route.ts
git commit -m "feat(github): OAuth connect route"
```

---

## Task 6: OAuth callback route

Verifies `state`, exchanges the code, ensures the repo, stores the encrypted connection, and redirects back to the profile with a status query param.

**Files:**
- Create: `app/api/github/callback/route.ts`

- [ ] **Step 1: Write the route**

Create `app/api/github/callback/route.ts`:

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createRouteClient, createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { encryptApiKey } from "@/lib/crypto/api-keys";
import { exchangeCodeForToken, getGithubLogin, ensureRepo } from "@/lib/github/client";

export const dynamic = "force-dynamic";

const REPO_NAME = "cpproad-submissions";

export async function GET(request: NextRequest) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = request.cookies.get("gh_oauth_state")?.value;
  const profileUrl = new URL("/dashboard/profile", url.origin);

  const finish = (status: string) => {
    profileUrl.searchParams.set("github", status);
    const res = NextResponse.redirect(profileUrl);
    res.cookies.delete("gh_oauth_state");
    return res;
  };

  if (!code || !state || !cookieState || state !== cookieState) {
    return finish("error");
  }

  try {
    const token = await exchangeCodeForToken(code);
    const login = await getGithubLogin(token);
    const repoFullName = await ensureRepo(token, login, REPO_NAME);
    const enc = encryptApiKey(token);

    const svc = createServiceClient();
    const { error } = await svc.from("github_connections").upsert(
      {
        user_id: userId,
        github_login: login,
        repo_full_name: repoFullName,
        encrypted_token: enc.ciphertext,
        iv: enc.iv,
        auth_tag: enc.authTag,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);

    return finish("connected");
  } catch (err) {
    console.error("[github-callback]", err instanceof Error ? err.message : err);
    return finish("error");
  }
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/github/callback/route.ts
git commit -m "feat(github): OAuth callback stores encrypted connection"
```

---

## Task 7: Disconnect route

**Files:**
- Create: `app/api/github/route.ts`

- [ ] **Step 1: Write the route**

Create `app/api/github/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  // RLS "own connection delete" policy restricts this to the caller's row.
  await supabase.from("github_connections").delete().eq("user_id", userId);

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/github/route.ts
git commit -m "feat(github): disconnect route"
```

---

## Task 8: GitHub sync settings card

Mirrors `ApiKeyCard`: connected/not-connected states, "Connect GitHub" (link to `/api/github/connect`), "Disconnect" (DELETE), and a success/error toast driven by the `?github=` param the callback sets.

**Files:**
- Create: `components/profile/GithubSyncCard.tsx`

- [ ] **Step 1: Write the component**

Create `components/profile/GithubSyncCard.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ExternalLink } from "lucide-react";

interface GithubSyncCardProps {
  connected: boolean;
  login: string;
  repoFullName: string;
}

export function GithubSyncCard({
  connected: initialConnected,
  login,
  repoFullName,
}: GithubSyncCardProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [connected, setConnected] = useState(initialConnected);
  const [removing, setRemoving] = useState(false);

  // Surface the OAuth callback result once, then clean the URL.
  useEffect(() => {
    const status = params.get("github");
    if (status === "connected") toast.success("GitHub connected");
    else if (status === "error") toast.error("Couldn't connect GitHub. Please try again.");
    if (status) router.replace("/dashboard/profile");
  }, [params, router]);

  async function handleDisconnect() {
    setRemoving(true);
    try {
      const res = await fetch("/api/github", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setConnected(false);
      toast.success("GitHub disconnected");
    } catch {
      toast.error("Failed to disconnect");
    } finally {
      setRemoving(false);
    }
  }

  if (!connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>GitHub sync</CardTitle>
          <CardDescription>Auto-commit your passed solutions to GitHub</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Connect GitHub and every solution you pass is committed to a public{" "}
            <code className="rounded bg-muted px-1">cpproad-submissions</code> repo — so your
            progress shows on your contribution graph.
          </p>
          <Button render={<a href="/api/github/connect" />}>Connect GitHub</Button>
        </CardContent>
      </Card>
    );
  }

  const repoUrl = `https://github.com/${repoFullName}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub sync</CardTitle>
        <CardDescription>Passed solutions are committed automatically</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">@{login}</p>
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {repoFullName}
              <ExternalLink className="size-3" />
            </a>
          </div>
          <Badge variant="secondary">Connected</Badge>
        </div>

        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="outline" disabled={removing} />}>
            {removing ? <Spinner className="size-4" /> : "Disconnect"}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect GitHub?</AlertDialogTitle>
              <AlertDialogDescription>
                New solutions will stop syncing. Your existing repo and commits are kept.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDisconnect}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/profile/GithubSyncCard.tsx
git commit -m "feat(profile): GitHub sync settings card"
```

---

## Task 9: Wire the card into the profile page

**Files:**
- Modify: `app/dashboard/profile/page.tsx` (fetch connection, pass props)
- Modify: `components/profile/ProfilePage.tsx` (accept prop, render card)

- [ ] **Step 1: Fetch the connection in the server page**

In `app/dashboard/profile/page.tsx`, add a fourth query to the `Promise.all` (after the `user_api_keys` query, line 17-21):

```ts
    supabase
      .from("github_connections")
      .select("github_login, repo_full_name")
      .single(),
```

Rename the destructured array (line 10) to include it:

```ts
  const [statsResult, onboardingResult, progressResult, apiKeyResult, githubResult] =
    await Promise.all([
```

After the `apiKeyStatus` block (line 48-54), add:

```ts
  const github = githubResult.data as { github_login: string; repo_full_name: string } | null;
  const githubStatus = github
    ? { connected: true, login: github.github_login, repoFullName: github.repo_full_name }
    : { connected: false, login: "", repoFullName: "" };
```

Pass it to `<ProfilePage … />` (after `apiKeyStatus={apiKeyStatus}`):

```tsx
      githubStatus={githubStatus}
```

- [ ] **Step 2: Accept and render in ProfilePage**

In `components/profile/ProfilePage.tsx`:

Add to the `import { ApiKeyCard }` area (after line 44):

```ts
import { GithubSyncCard } from "./GithubSyncCard";
```

Add to `ProfilePageProps` (after the `apiKeyStatus` field, line 57-61):

```ts
  githubStatus: {
    connected: boolean;
    login: string;
    repoFullName: string;
  };
```

Add `githubStatus` to the destructured params (after `apiKeyStatus,` line 97):

```ts
  githubStatus,
```

Render it right after the API Key section (`</motion.div>` closing the ApiKeyCard block, line 324):

```tsx
        {/* Section: GitHub sync */}
        <motion.div variants={itemVariants}>
          <GithubSyncCard
            connected={githubStatus.connected}
            login={githubStatus.login}
            repoFullName={githubStatus.repoFullName}
          />
        </motion.div>
```

- [ ] **Step 3: Typecheck, lint, build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: no new errors; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/profile/page.tsx components/profile/ProfilePage.tsx
git commit -m "feat(profile): render GitHub sync card"
```

---

## Task 10: Env vars + operator setup docs

The feature is inert until the operator registers a GitHub OAuth App and sets two env vars — only the repo owner can do this.

**Files:**
- Modify: `.env.example`
- Modify: `CLAUDE.md` (note the one-time setup under an appropriate section, e.g. near env/deploy notes)

- [ ] **Step 1: Add env vars to `.env.example`**

Append to `.env.example`:

```
# GitHub Sync (OAuth App) — register at https://github.com/settings/developers
# Authorization callback URL: <your-site>/api/github/callback
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=
# Token encryption reuses the existing API_KEY_ENCRYPTION_SECRET (no new secret needed).
```

- [ ] **Step 2: Document the one-time operator setup in `CLAUDE.md`**

Add a short subsection (e.g. under the build/dev or deploy notes):

```markdown
### GitHub Sync setup (one-time, operator only)

1. Create a GitHub OAuth App at https://github.com/settings/developers
   - Homepage URL: your site URL
   - Authorization callback URL: `<your-site>/api/github/callback`
2. Set `GITHUB_OAUTH_CLIENT_ID` and `GITHUB_OAUTH_CLIENT_SECRET` in the environment.
3. Token encryption reuses `API_KEY_ENCRYPTION_SECRET`.

Scope requested is `public_repo` (create + write public repos only). Users connect at
`/dashboard/profile`; passed submits then commit to their `cpproad-submissions` repo.
```

- [ ] **Step 3: Commit**

```bash
git add .env.example CLAUDE.md
git commit -m "docs(github): document GitHub sync OAuth setup + env vars"
```

---

## Manual verification (after all tasks, with a real OAuth App configured)

1. `npm run dev`, sign in, go to `/dashboard/profile` → "GitHub sync" card shows **Connect GitHub**.
2. Click it → GitHub consent (scope: public repositories) → redirected back → toast "GitHub connected", card shows **@login** + repo link.
3. Confirm the `cpproad-submissions` repo now exists on GitHub (public).
4. Open an exercise, submit a solution that **passes** → within a moment the repo has `<lesson>/<exercise>/submission-0.cpp` as a new commit authored by you.
5. Submit the same exercise again (passing) → `submission-1.cpp` appears.
6. Submit a **failing** solution → no new commit.
7. Disconnect on the profile → confirm; connecting again reuses the same repo (no duplicate).

---

## Self-review

- **Spec coverage:** Connect flow (T5/T6), `github_connections` table + RLS (T1), sync helper best-effort (T3), submissions hook passed-only (T4), settings card connect/disconnect (T8/T9), env vars (T10), the "one PUT at expected path / 500 doesn't fail submit" test (T3). Out-of-scope items (status filter, backfill, manual sync, private, toggle) correctly absent.
- **Type consistency:** `encryptApiKey` → `{ciphertext, iv, authTag}` stored as `encrypted_token/iv/auth_tag`; `decryptApiKey({ciphertext, iv, authTag})` reads them back (T3/T6). `buildSubmissionPath`/`slugify`/`putFile`/`syncSubmission`/`ensureRepo`/`getGithubLogin`/`exchangeCodeForToken` signatures match across tasks. `github_connections` columns identical in migration, types fallback, and all queries. Card props (`connected/login/repoFullName`) match page → ProfilePage → GithubSyncCard.
- **No placeholders:** every code step is complete and runnable.
```
