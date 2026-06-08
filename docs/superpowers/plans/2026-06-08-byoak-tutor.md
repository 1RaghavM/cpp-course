# BYOAK Tutor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users provide their own Gemini API key for the tutor, encrypted at rest, so the platform owner pays nothing for tutor usage.

**Architecture:** New `user_api_keys` + `user_api_key_events` tables in Supabase with RLS. Application-level AES-256-GCM encryption via `lib/crypto/api-keys.ts`. Three new API routes for key CRUD. Modified `/api/chat` route to decrypt user's key per-request. TutorPanel conditionally renders a setup screen or invalid-key screen based on key status.

**Tech Stack:** Next.js 14 App Router, Supabase Postgres + RLS, Node.js `crypto` module, `@ai-sdk/google`, shadcn/ui components.

**Spec:** `docs/superpowers/specs/2026-06-08-byoak-tutor-design.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `infra/supabase/migrations/014_user_api_keys.sql` | Schema for `user_api_keys` + `user_api_key_events` tables |
| Create | `lib/crypto/api-keys.ts` | AES-256-GCM encrypt/decrypt functions |
| Create | `app/api/profile/api-key/route.ts` | GET/POST/DELETE handlers for key CRUD |
| Modify | `lib/ai/model.ts` | Accept optional API key param in `tutorModel()` |
| Modify | `app/api/chat/route.ts` | Fetch + decrypt user key, create per-request model, skip daily cap |
| Modify | `lib/rate/guard.ts` | Add `bypassDailyCap` option to `checkRateAndBudget()` |
| Modify | `app/api/chat/quota/route.ts` | Return `hasByoakKey` flag so client knows to hide quota |
| Create | `components/tutor/ApiKeySetup.tsx` | Full setup walkthrough screen |
| Create | `components/tutor/ApiKeyInvalid.tsx` | Invalid-key re-entry screen |
| Modify | `components/tutor/TutorPanel.tsx` | Gate on key status, render setup/invalid screens |
| Modify | `components/tutor/QuotaIndicator.tsx` | Hide when user has BYOAK key |
| Create | `components/profile/ApiKeyCard.tsx` | Profile page key management card |
| Modify | `components/profile/ProfilePage.tsx` | Add ApiKeyCard between Learning Preferences and Stats |
| Modify | `app/dashboard/profile/page.tsx` | Fetch key status, pass to ProfilePage |
| Modify | `lib/supabase/types.ts` | Add `user_api_keys` and `user_api_key_events` table types |
| Modify | `.env.example` | Add `API_KEY_ENCRYPTION_SECRET` placeholder |

---

## Task 1: Database Migration

**Files:**
- Create: `infra/supabase/migrations/014_user_api_keys.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 014_user_api_keys.sql
-- BYOAK: encrypted storage for user-provided LLM API keys

CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google',
  encrypted_key TEXT NOT NULL,
  iv TEXT NOT NULL,
  auth_tag TEXT NOT NULL,
  key_preview TEXT NOT NULL,
  key_version INTEGER NOT NULL DEFAULT 1,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own keys"
  ON user_api_keys FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE user_api_key_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_api_key_events ENABLE ROW LEVEL SECURITY;
-- Admin-only: no user-facing policies
```

- [ ] **Step 2: Apply the migration**

Run: `npx supabase db push`
Expected: Tables `user_api_keys` and `user_api_key_events` created.

- [ ] **Step 3: Update TypeScript types**

Add to `lib/supabase/types.ts` inside `Database > public > Tables`, after the existing tables:

```typescript
user_api_keys: {
  Row: {
    id: string;
    user_id: string;
    provider: string;
    encrypted_key: string;
    iv: string;
    auth_tag: string;
    key_preview: string;
    key_version: number;
    is_valid: boolean;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    provider?: string;
    encrypted_key: string;
    iv: string;
    auth_tag: string;
    key_preview: string;
    key_version?: number;
    is_valid?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    provider?: string;
    encrypted_key?: string;
    iv?: string;
    auth_tag?: string;
    key_preview?: string;
    key_version?: number;
    is_valid?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};
user_api_key_events: {
  Row: {
    id: string;
    user_id: string;
    event: string;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    event: string;
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    event?: string;
    created_at?: string;
  };
  Relationships: [];
};
```

- [ ] **Step 4: Add env var placeholder**

Add to `.env.example`:

```
# BYOAK: 32-byte random key, base64-encoded. Generate with: openssl rand -base64 32
API_KEY_ENCRYPTION_SECRET=<placeholder>
```

Also add a real value to your local `.env`:

Run: `openssl rand -base64 32` and paste the result as `API_KEY_ENCRYPTION_SECRET=<generated-value>` in `.env`.

- [ ] **Step 5: Commit**

```bash
git add infra/supabase/migrations/014_user_api_keys.sql lib/supabase/types.ts .env.example
git commit -m "feat(byoak): add user_api_keys schema and types"
```

---

## Task 2: Encryption Layer

**Files:**
- Create: `lib/crypto/api-keys.ts`

- [ ] **Step 1: Write the encryption module**

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error("API_KEY_ENCRYPTION_SECRET is not set");
  }
  const key = Buffer.from(secret, "base64");
  if (key.length !== 32) {
    throw new Error("API_KEY_ENCRYPTION_SECRET must be 32 bytes (base64-encoded)");
  }
  return key;
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export function encryptApiKey(plaintext: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decryptApiKey(payload: EncryptedPayload): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(payload.iv, "base64");
  const authTag = Buffer.from(payload.authTag, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}

export function keyPreview(apiKey: string): string {
  return "..." + apiKey.slice(-4);
}
```

- [ ] **Step 2: Verify it works**

Run in a quick script or Node REPL (make sure `.env` has `API_KEY_ENCRYPTION_SECRET` set):

```bash
npx tsx -e "
const { encryptApiKey, decryptApiKey, keyPreview } = require('./lib/crypto/api-keys');
const key = 'AIzaSyDummyTestKey1234567890abcdefg';
const enc = encryptApiKey(key);
console.log('encrypted:', enc);
const dec = decryptApiKey(enc);
console.log('decrypted:', dec);
console.log('match:', dec === key);
console.log('preview:', keyPreview(key));
"
```

Expected: `match: true`, preview shows `...efg` (or whatever the last 4 chars are).

- [ ] **Step 3: Commit**

```bash
git add lib/crypto/api-keys.ts
git commit -m "feat(byoak): add AES-256-GCM encryption for API keys"
```

---

## Task 3: API Key CRUD Routes

**Files:**
- Create: `app/api/profile/api-key/route.ts`

- [ ] **Step 1: Write the route handler**

```typescript
import { NextResponse } from "next/server";
import { createRouteClient, createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { encryptApiKey, decryptApiKey, keyPreview } from "@/lib/crypto/api-keys";

export const dynamic = "force-dynamic";

const GEMINI_KEY_REGEX = /^AIza[A-Za-z0-9_-]{35}$/;
const MAX_SAVE_ATTEMPTS_PER_HOUR = 5;

async function checkSaveRateLimit(
  userId: string,
): Promise<boolean> {
  const serviceClient = createServiceClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await serviceClient
    .from("user_api_key_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("event", ["created", "updated"])
    .gte("created_at", oneHourAgo);

  return (count ?? 0) < MAX_SAVE_ATTEMPTS_PER_HOUR;
}

async function validateGeminiKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(apiKey)}`,
      { signal: AbortSignal.timeout(5000) },
    );
    return res.ok;
  } catch {
    return false;
  }
}

// ─── GET: key status ─────────────────────────────────────────────────────────

export async function GET() {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  const { data } = await supabase
    .from("user_api_keys")
    .select("key_preview, is_valid, provider")
    .eq("user_id", userId)
    .eq("provider", "google")
    .single();

  if (!data) {
    return NextResponse.json({ hasKey: false });
  }

  return NextResponse.json({
    hasKey: true,
    preview: data.key_preview,
    isValid: data.is_valid,
    provider: data.provider,
  });
}

// ─── POST: save or update key ────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  const withinLimit = await checkSaveRateLimit(userId);
  if (!withinLimit) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many attempts. Try again in an hour." } },
      { status: 429 },
    );
  }

  let body: { provider?: string; apiKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      { status: 400 },
    );
  }

  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  if (!GEMINI_KEY_REGEX.test(apiKey)) {
    return NextResponse.json(
      { error: { code: "INVALID_FORMAT", message: "Invalid key format" } },
      { status: 400 },
    );
  }

  const isLive = await validateGeminiKey(apiKey);
  if (!isLive) {
    return NextResponse.json(
      { error: { code: "KEY_VALIDATION_FAILED", message: "This key doesn't appear to work. Double-check that you copied the full key from Google AI Studio." } },
      { status: 422 },
    );
  }

  const encrypted = encryptApiKey(apiKey);
  const preview = keyPreview(apiKey);

  const { data: existing } = await supabase
    .from("user_api_keys")
    .select("id")
    .eq("user_id", userId)
    .eq("provider", "google")
    .single();

  if (existing) {
    await supabase
      .from("user_api_keys")
      .update({
        encrypted_key: encrypted.ciphertext,
        iv: encrypted.iv,
        auth_tag: encrypted.authTag,
        key_preview: preview,
        is_valid: true,
        key_version: 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    const serviceClient = createServiceClient();
    await serviceClient.from("user_api_key_events").insert({
      user_id: userId,
      event: "updated",
    });
  } else {
    await supabase.from("user_api_keys").insert({
      user_id: userId,
      provider: "google",
      encrypted_key: encrypted.ciphertext,
      iv: encrypted.iv,
      auth_tag: encrypted.authTag,
      key_preview: preview,
      is_valid: true,
      key_version: 1,
    });

    const serviceClient = createServiceClient();
    await serviceClient.from("user_api_key_events").insert({
      user_id: userId,
      event: "created",
    });
  }

  return NextResponse.json({ preview, isValid: true });
}

// ─── DELETE: remove key ──────────────────────────────────────────────────────

export async function DELETE(request: Request) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  let body: { confirm?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      { status: 400 },
    );
  }

  if (body.confirm !== true) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Confirmation required" } },
      { status: 400 },
    );
  }

  await supabase
    .from("user_api_keys")
    .delete()
    .eq("user_id", userId)
    .eq("provider", "google");

  const serviceClient = createServiceClient();
  await serviceClient.from("user_api_key_events").insert({
    user_id: userId,
    event: "deleted",
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Test manually via curl**

Start the dev server (`npm run dev`), then test with a valid session cookie:

```bash
# GET — should return hasKey: false initially
curl -b <cookie> http://localhost:3000/api/profile/api-key

# POST — save a key (use a real Gemini key to test live validation)
curl -X POST -b <cookie> -H 'Content-Type: application/json' \
  -d '{"apiKey":"AIzaYourRealTestKeyHere1234567890abc"}' \
  http://localhost:3000/api/profile/api-key

# GET — should return hasKey: true with preview
curl -b <cookie> http://localhost:3000/api/profile/api-key

# DELETE — remove it
curl -X DELETE -b <cookie> -H 'Content-Type: application/json' \
  -d '{"confirm":true}' \
  http://localhost:3000/api/profile/api-key
```

- [ ] **Step 3: Commit**

```bash
git add app/api/profile/api-key/route.ts
git commit -m "feat(byoak): add API key CRUD route handlers"
```

---

## Task 4: Wire User Key Into Tutor

**Files:**
- Modify: `lib/ai/model.ts`
- Modify: `lib/rate/guard.ts`
- Modify: `app/api/chat/route.ts`
- Modify: `app/api/chat/quota/route.ts`

- [ ] **Step 1: Update `lib/ai/model.ts` to accept an optional API key**

Replace the entire file:

```typescript
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { google } from "@ai-sdk/google";

export function tutorModel(apiKey?: string) {
  if (apiKey) {
    const userGoogle = createGoogleGenerativeAI({ apiKey });
    return userGoogle("gemini-2.5-flash");
  }
  return google("gemini-2.5-flash");
}
```

- [ ] **Step 2: Update `lib/rate/guard.ts` to support bypassing daily cap**

Replace the `checkRateAndBudget` function signature and the daily cap block:

Change the function signature from:

```typescript
export function checkRateAndBudget(input: GuardInput): GuardResult {
```

To:

```typescript
export function checkRateAndBudget(input: GuardInput, options?: { bypassDailyCap?: boolean }): GuardResult {
```

Then change the daily cap block from:

```typescript
  if (input.dailyCount >= TUTOR_CONFIG.dailyMsgCap) {
    return {
      allowed: false,
      code: "RATE_LIMITED",
      message: `You've used all ${TUTOR_CONFIG.dailyMsgCap} messages for today. Come back tomorrow!`,
    };
  }
```

To:

```typescript
  if (!options?.bypassDailyCap && input.dailyCount >= TUTOR_CONFIG.dailyMsgCap) {
    return {
      allowed: false,
      code: "RATE_LIMITED",
      message: `You've used all ${TUTOR_CONFIG.dailyMsgCap} messages for today. Come back tomorrow!`,
    };
  }
```

- [ ] **Step 3: Update `app/api/chat/route.ts` to use user's key**

Add imports at the top of the file (after existing imports):

```typescript
import { decryptApiKey } from "@/lib/crypto/api-keys";
```

After the `const userId = authResult.user.id;` line (line 34), add the key lookup:

```typescript
  const { data: apiKeyRow } = await supabase
    .from("user_api_keys")
    .select("encrypted_key, iv, auth_tag, is_valid")
    .eq("user_id", userId)
    .eq("provider", "google")
    .single();

  if (!apiKeyRow) {
    return NextResponse.json(
      { error: { code: "API_KEY_REQUIRED", message: "Please add your Gemini API key to use the tutor." } },
      { status: 403 },
    );
  }

  if (!apiKeyRow.is_valid) {
    return NextResponse.json(
      { error: { code: "API_KEY_INVALID", message: "Your API key is no longer working. Please update it." } },
      { status: 403 },
    );
  }

  let userApiKey: string;
  try {
    userApiKey = decryptApiKey({
      ciphertext: apiKeyRow.encrypted_key,
      iv: apiKeyRow.iv,
      authTag: apiKeyRow.auth_tag,
    });
  } catch {
    return NextResponse.json(
      { error: { code: "API_KEY_INVALID", message: "Failed to read your API key. Please re-enter it." } },
      { status: 403 },
    );
  }
```

Change the guard call from:

```typescript
  const guardResult = checkRateAndBudget(guardCounts);
```

To:

```typescript
  const guardResult = checkRateAndBudget(guardCounts, { bypassDailyCap: true });
```

Change the `streamText` call from:

```typescript
  const result = streamText({
    model: tutorModel(),
```

To:

```typescript
  const result = streamText({
    model: tutorModel(userApiKey),
```

Wrap the entire `streamText` call + return in a try/catch to handle Gemini auth failures:

```typescript
  try {
    const result = streamText({
      model: tutorModel(userApiKey),
      // ... rest of the existing streamText params stay the same ...
    });

    return result.toUIMessageStreamResponse();
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 401 || status === 403) {
      await supabase
        .from("user_api_keys")
        .update({ is_valid: false, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("provider", "google");

      const serviceClient = createServiceClient();
      await serviceClient.from("user_api_key_events").insert({
        user_id: userId,
        event: "invalidated",
      });

      return NextResponse.json(
        { error: { code: "API_KEY_INVALID", message: "Your API key is no longer working." } },
        { status: 403 },
      );
    }
    throw err;
  }
```

- [ ] **Step 4: Update `app/api/chat/quota/route.ts` to include BYOAK status**

After the auth check, add a key lookup and include it in the response:

```typescript
  const { data: apiKeyData } = await supabase
    .from("user_api_keys")
    .select("id")
    .eq("user_id", authResult.user.id)
    .eq("provider", "google")
    .single();

  const hasByoakKey = !!apiKeyData;
```

Add `hasByoakKey` to the response JSON:

```typescript
  return NextResponse.json({
    usedToday: dailyRes.count ?? 0,
    dailyCap: TUTOR_CONFIG.dailyMsgCap,
    monthSpendUsd: monthSpendMicro / 1_000_000,
    monthCapUsd: TUTOR_CONFIG.monthlyHardCapMicro / 1_000_000,
    hasByoakKey,
  });
```

- [ ] **Step 5: Test the tutor flow**

1. Remove your `GOOGLE_GENERATIVE_AI_API_KEY` from `.env` (or rename it temporarily) to confirm the tutor now requires a user key.
2. Add a key via `POST /api/profile/api-key`.
3. Send a tutor message — should stream a response using the user's key.
4. Test with an invalid key — should get `API_KEY_INVALID` error.

- [ ] **Step 6: Commit**

```bash
git add lib/ai/model.ts lib/rate/guard.ts app/api/chat/route.ts app/api/chat/quota/route.ts
git commit -m "feat(byoak): wire user's Gemini key into tutor chat route"
```

---

## Task 5: Tutor Setup & Invalid-Key Screens

**Files:**
- Create: `components/tutor/ApiKeySetup.tsx`
- Create: `components/tutor/ApiKeyInvalid.tsx`
- Modify: `components/tutor/TutorPanel.tsx`
- Modify: `components/tutor/QuotaIndicator.tsx`

- [ ] **Step 1: Create `components/tutor/ApiKeySetup.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, ExternalLink, Key } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ApiKeySetupProps {
  onKeySaved: () => void;
}

type Status = "idle" | "validating" | "error" | "rate-limited";

export default function ApiKeySetup({ onKeySaved }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = apiKey.trim();
    if (!trimmed) return;

    setStatus("validating");
    setErrorMessage("");

    try {
      const res = await fetch("/api/profile/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmed }),
      });

      if (res.ok) {
        onKeySaved();
        return;
      }

      const data = await res.json();
      const code = data?.error?.code;

      if (code === "RATE_LIMITED") {
        setStatus("rate-limited");
      } else {
        setStatus("error");
        setErrorMessage(
          data?.error?.message ?? "This key doesn't appear to work. Double-check that you copied the full key from Google AI Studio.",
        );
      }
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col items-center px-6 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Key className="size-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Set up your AI Tutor</h2>
            <p className="text-sm text-muted-foreground">
              The tutor is powered by Google&apos;s Gemini AI. To use it, you&apos;ll need your own
              free API key. Your key is encrypted and stored securely.
            </p>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground">How to get your API key</p>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-medium text-foreground">1.</span>
                <span>
                  Go to{" "}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    Google AI Studio
                    <ExternalLink className="size-3" />
                  </a>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">2.</span>
                <span>Sign in with your Google account</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">3.</span>
                <span>Click &quot;Create API Key&quot;</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-foreground">4.</span>
                <span>
                  Copy the key (it starts with <code className="rounded bg-muted px-1">AIza</code>)
                </span>
              </li>
            </ol>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API key here"
              autoComplete="off"
              spellCheck={false}
              disabled={status === "validating"}
            />

            {status === "error" && (
              <Alert className="bg-error/10 border-error/20 text-error">
                <AlertCircle className="size-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {status === "rate-limited" && (
              <Alert className="bg-warning/10 border-warning/20 text-warning">
                <AlertCircle className="size-4" />
                <AlertDescription>Too many attempts. Please try again in an hour.</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!apiKey.trim() || status === "validating" || status === "rate-limited"}
            >
              {status === "validating" ? (
                <span className="flex items-center gap-2">
                  <Spinner className="size-4" />
                  Checking your key...
                </span>
              ) : (
                "Save key"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Your key is encrypted with AES-256 and only used to power your tutor sessions. You can
            remove it anytime from your{" "}
            <a href="/dashboard/profile" className="text-primary hover:underline">
              profile
            </a>
            .
          </p>
        </div>
      </div>
    </ScrollArea>
  );
}
```

- [ ] **Step 2: Create `components/tutor/ApiKeyInvalid.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ApiKeyInvalidProps {
  preview: string;
  onKeyUpdated: () => void;
  onKeyRemoved: () => void;
}

type Status = "idle" | "validating" | "removing" | "error" | "rate-limited";

export default function ApiKeyInvalid({ preview, onKeyUpdated, onKeyRemoved }: ApiKeyInvalidProps) {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = apiKey.trim();
    if (!trimmed) return;

    setStatus("validating");
    setErrorMessage("");

    try {
      const res = await fetch("/api/profile/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmed }),
      });

      if (res.ok) {
        onKeyUpdated();
        return;
      }

      const data = await res.json();
      const code = data?.error?.code;

      if (code === "RATE_LIMITED") {
        setStatus("rate-limited");
      } else {
        setStatus("error");
        setErrorMessage(data?.error?.message ?? "This key doesn't appear to work.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  }

  async function handleRemove() {
    setStatus("removing");
    try {
      const res = await fetch("/api/profile/api-key", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (res.ok) {
        onKeyRemoved();
      }
    } catch {
      setStatus("idle");
    }
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col items-center px-6 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-warning/10">
              <AlertTriangle className="size-6 text-warning" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Your API key is no longer working</h2>
            <p className="text-sm text-muted-foreground">
              Key: <code className="rounded bg-muted px-1">{preview}</code>
            </p>
            <p className="text-sm text-muted-foreground">
              This usually means the key was revoked or deleted in Google AI Studio. Please enter a
              new key to continue using the tutor.
            </p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-3">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your new API key"
              autoComplete="off"
              spellCheck={false}
              disabled={status === "validating" || status === "removing"}
            />

            {status === "error" && (
              <Alert className="bg-error/10 border-error/20 text-error">
                <AlertCircle className="size-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {status === "rate-limited" && (
              <Alert className="bg-warning/10 border-warning/20 text-warning">
                <AlertCircle className="size-4" />
                <AlertDescription>Too many attempts. Please try again in an hour.</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={!apiKey.trim() || status === "validating" || status === "removing" || status === "rate-limited"}
              >
                {status === "validating" ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="size-4" />
                    Checking...
                  </span>
                ) : (
                  "Update key"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleRemove}
                disabled={status === "validating" || status === "removing"}
              >
                {status === "removing" ? <Spinner className="size-4" /> : "Remove key"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ScrollArea>
  );
}
```

- [ ] **Step 3: Update `components/tutor/TutorPanel.tsx`**

Add imports at the top:

```typescript
import ApiKeySetup from "./ApiKeySetup";
import ApiKeyInvalid from "./ApiKeyInvalid";
```

Add state for key status inside the `TutorPanel` component, after the existing `useState` calls:

```typescript
const [keyStatus, setKeyStatus] = useState<{
  hasKey: boolean;
  isValid: boolean;
  preview: string;
} | null>(null);
const [keyLoading, setKeyLoading] = useState(true);
```

Add an effect to fetch key status on mount (after the existing `useMemo` calls):

```typescript
useEffect(() => {
  fetch("/api/profile/api-key")
    .then((r) => r.json())
    .then((data) => {
      setKeyStatus({
        hasKey: data.hasKey ?? false,
        isValid: data.isValid ?? false,
        preview: data.preview ?? "",
      });
    })
    .catch(() => {
      setKeyStatus({ hasKey: false, isValid: false, preview: "" });
    })
    .finally(() => setKeyLoading(false));
}, []);
```

Add `useEffect` to the imports from `react` (it's not currently imported).

In the `onError` callback, add handling for the new error codes:

```typescript
onError(err) {
  try {
    const parsed = JSON.parse(err.message) as { error?: { code?: string } };
    if (parsed?.error?.code === "RATE_LIMITED" || parsed?.error?.code === "BUDGET_EXCEEDED") {
      setQuotaExhausted(true);
    }
    if (parsed?.error?.code === "API_KEY_REQUIRED") {
      setKeyStatus({ hasKey: false, isValid: false, preview: "" });
    }
    if (parsed?.error?.code === "API_KEY_INVALID") {
      setKeyStatus((prev) => ({
        hasKey: true,
        isValid: false,
        preview: prev?.preview ?? "",
      }));
    }
  } catch {
    // not JSON, ignore
  }
},
```

Add key-refresh callbacks:

```typescript
const handleKeySaved = useCallback(() => {
  setKeyStatus({ hasKey: true, isValid: true, preview: "" });
  fetch("/api/profile/api-key")
    .then((r) => r.json())
    .then((data) => {
      setKeyStatus({
        hasKey: data.hasKey ?? false,
        isValid: data.isValid ?? false,
        preview: data.preview ?? "",
      });
    })
    .catch(() => {});
}, []);

const handleKeyRemoved = useCallback(() => {
  setKeyStatus({ hasKey: false, isValid: false, preview: "" });
}, []);
```

In the return statement, after `<TutorCoachmark />` and before the header `<div>`, add the conditional renders:

```tsx
{keyLoading && (
  <div className="flex flex-1 items-center justify-center">
    <Spinner className="size-6" />
  </div>
)}

{!keyLoading && keyStatus && !keyStatus.hasKey && (
  <ApiKeySetup onKeySaved={handleKeySaved} />
)}

{!keyLoading && keyStatus && keyStatus.hasKey && !keyStatus.isValid && (
  <ApiKeyInvalid
    preview={keyStatus.preview}
    onKeyUpdated={handleKeySaved}
    onKeyRemoved={handleKeyRemoved}
  />
)}
```

Wrap the rest of the existing UI (header, MessageList, error displays, Composer) in a conditional so it only shows when the key is valid:

```tsx
{!keyLoading && keyStatus?.hasKey && keyStatus.isValid && (
  <>
    {/* ...existing header, MessageList, error display, ExplainErrorButton, Composer... */}
  </>
)}
```

- [ ] **Step 4: Update `components/tutor/QuotaIndicator.tsx`**

Change the component to accept and use a `hasByoakKey` prop:

Add to the interface:

```typescript
interface QuotaIndicatorProps {
  refreshKey?: number;
  hasByoakKey?: boolean;
}
```

Change the function signature:

```typescript
export default function QuotaIndicator({ refreshKey = 0, hasByoakKey = false }: QuotaIndicatorProps) {
```

Add early return after the existing null checks:

```typescript
if (hasByoakKey) return null;
```

In `TutorPanel.tsx`, update the `QuotaIndicator` usage:

```tsx
<QuotaIndicator
  refreshKey={messages.length}
  hasByoakKey={keyStatus?.hasKey && keyStatus.isValid}
/>
```

- [ ] **Step 5: Test in browser**

1. Run `npm run dev`
2. Open the tutor — should see the setup screen with the full walkthrough
3. Paste a valid Gemini key — should validate and transition to the chat
4. Send a message — should get a response
5. Check profile page — API Key card not yet added (Task 6)
6. Open browser devtools Network tab, confirm no plaintext key in any response

- [ ] **Step 6: Commit**

```bash
git add components/tutor/ApiKeySetup.tsx components/tutor/ApiKeyInvalid.tsx components/tutor/TutorPanel.tsx components/tutor/QuotaIndicator.tsx
git commit -m "feat(byoak): add tutor setup/invalid screens and key gating"
```

---

## Task 6: Profile Page Key Management

**Files:**
- Create: `components/profile/ApiKeyCard.tsx`
- Modify: `components/profile/ProfilePage.tsx`
- Modify: `app/dashboard/profile/page.tsx`

- [ ] **Step 1: Create `components/profile/ApiKeyCard.tsx`**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ExternalLink } from "lucide-react";

interface ApiKeyCardProps {
  hasKey: boolean;
  preview: string;
  isValid: boolean;
}

export function ApiKeyCard({ hasKey: initialHasKey, preview: initialPreview, isValid: initialIsValid }: ApiKeyCardProps) {
  const [hasKey, setHasKey] = useState(initialHasKey);
  const [preview, setPreview] = useState(initialPreview);
  const [isValid, setIsValid] = useState(initialIsValid);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  async function handleSaveKey(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = apiKey.trim();
    if (!trimmed) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/profile/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmed }),
      });

      if (res.ok) {
        const data = await res.json();
        setHasKey(true);
        setPreview(data.preview);
        setIsValid(true);
        setApiKey("");
        setUpdateOpen(false);
        toast.success("API key saved");
      } else {
        const data = await res.json();
        setError(data?.error?.message ?? "Failed to save key");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      const res = await fetch("/api/profile/api-key", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (res.ok) {
        setHasKey(false);
        setPreview("");
        setIsValid(false);
        toast.success("API key removed");
      } else {
        toast.error("Failed to remove key");
      }
    } catch {
      toast.error("Failed to remove key");
    } finally {
      setRemoving(false);
    }
  }

  if (!hasKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Key</CardTitle>
          <CardDescription>Required for the AI tutor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            No API key set. Add your Gemini API key to use the tutor. Get one free at{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Google AI Studio
              <ExternalLink className="size-3" />
            </a>
          </p>
          <Dialog open={updateOpen} onOpenChange={(open) => { setUpdateOpen(open); if (!open) { setApiKey(""); setError(""); } }}>
            <DialogTrigger render={<Button />}>Add API key</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add API key</DialogTitle>
                <DialogDescription>Paste your Gemini API key. It will be validated and encrypted.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveKey} className="space-y-3">
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza..."
                  autoComplete="off"
                  spellCheck={false}
                  disabled={saving}
                />
                {error && (
                  <Alert className="bg-error/10 border-error/20 text-error">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={!apiKey.trim() || saving}>
                  {saving ? <span className="flex items-center gap-2"><Spinner className="size-4" />Checking...</span> : "Save key"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Key</CardTitle>
        <CardDescription>Used for the AI tutor</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Google Gemini</p>
            <p className="text-sm text-muted-foreground">
              <code className="rounded bg-muted px-1">{preview}</code>
            </p>
          </div>
          <Badge variant={isValid ? "secondary" : "destructive"}>
            {isValid ? "Active" : "Invalid"}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Used for the AI tutor. Get a new key at{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            aistudio.google.com
            <ExternalLink className="size-3" />
          </a>
        </p>

        <div className="flex gap-2">
          <Dialog open={updateOpen} onOpenChange={(open) => { setUpdateOpen(open); if (!open) { setApiKey(""); setError(""); } }}>
            <DialogTrigger render={<Button variant="outline" />}>Update key</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update API key</DialogTitle>
                <DialogDescription>Paste your new Gemini API key. It will be validated and encrypted.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveKey} className="space-y-3">
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza..."
                  autoComplete="off"
                  spellCheck={false}
                  disabled={saving}
                />
                {error && (
                  <Alert className="bg-error/10 border-error/20 text-error">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={!apiKey.trim() || saving}>
                  {saving ? <span className="flex items-center gap-2"><Spinner className="size-4" />Checking...</span> : "Save key"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="outline" disabled={removing} />}>
              {removing ? <Spinner className="size-4" /> : "Remove key"}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove your API key?</AlertDialogTitle>
                <AlertDialogDescription>
                  The tutor will be unavailable until you add a new key.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRemove}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remove key
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Update `components/profile/ProfilePage.tsx`**

Add the import:

```typescript
import { ApiKeyCard } from "./ApiKeyCard";
```

Add props to the `ProfilePageProps` interface:

```typescript
apiKeyStatus: {
  hasKey: boolean;
  preview: string;
  isValid: boolean;
};
```

Add the destructured prop in the function params:

```typescript
apiKeyStatus,
```

Add the card in the JSX, between the "Learning preferences" section and the "Stats" section (between the two `motion.div` wrappers). Insert:

```tsx
{/* Section: API Key */}
<motion.div variants={itemVariants}>
  <ApiKeyCard
    hasKey={apiKeyStatus.hasKey}
    preview={apiKeyStatus.preview}
    isValid={apiKeyStatus.isValid}
  />
</motion.div>
```

- [ ] **Step 3: Update `app/dashboard/profile/page.tsx`**

Add to the `Promise.all` array:

```typescript
supabase
  .from("user_api_keys")
  .select("key_preview, is_valid")
  .eq("provider", "google")
  .single(),
```

Destructure it (add a 4th element):

```typescript
const [statsResult, onboardingResult, progressResult, apiKeyResult] = await Promise.all([
```

Build the status object after the existing data extraction:

```typescript
const apiKeyStatus = apiKeyResult.data
  ? {
      hasKey: true,
      preview: apiKeyResult.data.key_preview,
      isValid: apiKeyResult.data.is_valid,
    }
  : { hasKey: false, preview: "", isValid: false };
```

Pass it to the component:

```tsx
<ProfilePage
  // ...existing props...
  apiKeyStatus={apiKeyStatus}
/>
```

- [ ] **Step 4: Test in browser**

1. Go to `/dashboard/profile`
2. When no key: card shows "No API key set" with "Add API key" button
3. Add a key via the dialog — should validate, save, show preview + "Active" badge
4. Click "Update key" — dialog opens, can replace the key
5. Click "Remove key" — confirmation dialog, then key removed, card shows no-key state
6. Go to tutor — should reflect the same key status

- [ ] **Step 5: Commit**

```bash
git add components/profile/ApiKeyCard.tsx components/profile/ProfilePage.tsx app/dashboard/profile/page.tsx
git commit -m "feat(byoak): add API key management card to profile page"
```

---

## Task 7: Remove Platform Gemini Key Dependency

**Files:**
- Modify: `lib/ai/model.ts`
- Modify: `.env.example`

- [ ] **Step 1: Clean up `lib/ai/model.ts`**

The fallback `google("gemini-2.5-flash")` (no API key) currently uses the env var `GOOGLE_GENERATIVE_AI_API_KEY`. Since all tutor calls now require a user key, remove the fallback:

```typescript
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export function tutorModel(apiKey: string) {
  const userGoogle = createGoogleGenerativeAI({ apiKey });
  return userGoogle("gemini-2.5-flash");
}
```

Note: the param is now required (not optional). The chat route already ensures a key exists before calling this.

- [ ] **Step 2: Update `.env.example`**

Remove or comment out `GOOGLE_GENERATIVE_AI_API_KEY`:

```
# GOOGLE_GENERATIVE_AI_API_KEY — no longer needed; users provide their own key via BYOAK
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: Build succeeds. No references to the singleton `google()` import remain in tutor code.

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add lib/ai/model.ts .env.example
git commit -m "feat(byoak): remove platform Gemini key, require user-provided key"
```

---

## Task Summary

| Task | Description | Key files |
|------|-------------|-----------|
| 1 | Database migration + types | `014_user_api_keys.sql`, `types.ts` |
| 2 | Encryption layer | `lib/crypto/api-keys.ts` |
| 3 | API key CRUD routes | `app/api/profile/api-key/route.ts` |
| 4 | Wire key into tutor + rate limit changes | `model.ts`, `guard.ts`, `chat/route.ts`, `quota/route.ts` |
| 5 | Tutor setup & invalid-key screens | `ApiKeySetup.tsx`, `ApiKeyInvalid.tsx`, `TutorPanel.tsx`, `QuotaIndicator.tsx` |
| 6 | Profile page key management | `ApiKeyCard.tsx`, `ProfilePage.tsx`, `profile/page.tsx` |
| 7 | Remove platform Gemini key dependency | `model.ts`, `.env.example` |
