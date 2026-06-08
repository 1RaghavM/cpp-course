# BYOAK (Bring Your Own API Key) — Tutor Feature

**Date:** 2026-06-08
**Scope:** Tutor only (Gemini 2.5 Flash). Lesson/exercise generation stays on the platform Anthropic key.
**Approach:** Application-level AES-256-GCM encryption, stored in Supabase with RLS.

---

## 1. Database Schema

### `user_api_keys` table

```sql
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
```

### `user_api_key_events` audit table

```sql
CREATE TABLE user_api_key_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event TEXT NOT NULL,  -- 'created', 'updated', 'deleted', 'invalidated'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_api_key_events ENABLE ROW LEVEL SECURITY;
-- No user-facing read policy: admin/service_role only
```

### Key design decisions

- `provider` column defaults to `'google'`, future-proofs for other providers.
- `key_preview` stores last 4 chars (e.g. `"...xK9m"`) so the UI can show a hint without exposing the full key.
- `is_valid` is set to `false` when Gemini returns 401 during a tutor call. User is prompted to re-enter.
- `key_version` tracks which encryption secret was used, enabling secret rotation.

---

## 2. Encryption Layer

New module: `lib/crypto/api-keys.ts`

- **Algorithm:** AES-256-GCM
- **Secret:** `API_KEY_ENCRYPTION_SECRET` — 32-byte random key, base64-encoded, stored as a Vercel env var (never committed).
- **Per-encryption:** fresh random 12-byte IV. No IV reuse.
- **Output:** `{ ciphertext, iv, authTag }` — all base64-encoded strings.

```typescript
encrypt(plaintext: string) -> { ciphertext: string, iv: string, authTag: string }
decrypt({ ciphertext, iv, authTag }) -> string
```

- Only called server-side in Route Handlers.
- Never imported in client code.
- GCM mode provides confidentiality + integrity (tamper detection via auth tag).

### Key rotation

When `API_KEY_ENCRYPTION_SECRET` is rotated:
1. Old secret is kept temporarily.
2. A migration script decrypts all rows with the old secret and re-encrypts with the new one.
3. `key_version` is bumped on each re-encrypted row.
4. Old secret is discarded.

---

## 3. API Routes — Security-Hardened

### Threat model

| Threat | Mitigation |
|---|---|
| Key leaked in logs/errors | Never log the key. Sanitize error objects before logging. Key never in any response body. |
| Key leaked in client bundle | All crypto in Route Handlers only. `lib/crypto/` has no `"use client"` exports. |
| Brute-force key save | Rate limit: 5 attempts per user per hour. Return 429 if exceeded. |
| Stolen DB dump | AES-256-GCM encrypted. Attacker also needs `API_KEY_ENCRYPTION_SECRET` from Vercel (separate system). |
| Stolen encryption secret | Rotate secret, re-encrypt all keys via migration. `key_version` tracks which secret encrypted each row. |
| Key becomes invalid | Validated on save. Marked `is_valid = false` on 401 during use. User prompted to re-enter. |
| CSRF | Next.js Route Handlers are same-origin. All endpoints require auth session cookie. |
| Decrypted key lingers in memory | Decrypted into a local variable scoped to the request handler, eligible for GC on request end. |
| Gemini error leaks key material | Gemini error messages are never forwarded to client. Generic error codes only. |

### `POST /api/profile/api-key`

Save or update the user's API key.

**Request:** `{ "provider": "google", "apiKey": "AIza..." }`
**Response:** `{ "preview": "...xK9m", "isValid": true }`

Flow:
1. `requireAuth()` — reject if unauthenticated.
2. Rate limit — max 5 key-save attempts per user per hour.
3. Input validation — must match `^AIza[A-Za-z0-9_-]{35}$`. Trim whitespace, reject control chars.
4. Live validation — call Gemini `models.list()` with a fresh SDK instance. Timeout 5s. On failure: `{ error: "KEY_VALIDATION_FAILED" }`.
5. Encrypt — fresh IV, AES-256-GCM.
6. Upsert — store encrypted blob, IV, auth tag, preview, `key_version`, `is_valid = true`.
7. Audit log — `'created'` or `'updated'` event. No key material logged.

### `GET /api/profile/api-key`

Return key metadata only. Never any key material.

**Response:** `{ "hasKey": true, "preview": "...xK9m", "isValid": true, "provider": "google" }`
or `{ "hasKey": false }`

### `DELETE /api/profile/api-key`

Remove the user's key.

**Request:** `{ "confirm": true }`
**Response:** `{ "ok": true }`

- Hard delete (not soft-delete). No encrypted material retained.
- Audit log: `'deleted'` event.

### Modified: `POST /api/chat`

Changes to the existing tutor route:
1. After auth, query `user_api_keys` for the user's google key.
2. No key -> `403 { error: { code: "API_KEY_REQUIRED" } }`.
3. Key exists but `is_valid = false` -> `403 { error: { code: "API_KEY_INVALID" } }`.
4. Decrypt key in a scoped block. Plaintext does not escape the handler.
5. Create a per-request `google()` model instance with the decrypted key. Never cache decrypted keys across requests.
6. On Gemini 401/403: mark `is_valid = false`, log `'invalidated'` audit event, return `{ error: { code: "API_KEY_INVALID" } }`. Do not forward Gemini error message.
7. Skip daily message cap. Per-minute rate limit still applies.

---

## 4. Tutor Panel UI

### Setup screen (no key)

Replaces the entire tutor chat area when `GET /api/profile/api-key` returns `hasKey: false`.

Full walkthrough content:
1. "The tutor is powered by Google's Gemini AI. To use it, you'll need your own free API key."
2. Step-by-step: Go to aistudio.google.com -> Sign in -> Click "Get API Key" -> Click "Create API Key" -> Copy it (starts with "AIza...")
3. Input field to paste the key.
4. "Save Key" button.
5. Footer: "Your key is encrypted with AES-256 and only used to power your tutor sessions. You can remove it anytime from your profile."

UI states:
- **Idle** — input + button.
- **Validating** — spinner, "Checking your key..."
- **Error** — red alert: "This key doesn't appear to work. Double-check that you copied the full key from Google AI Studio."
- **Rate limited** — "Too many attempts. Please try again in an hour."
- **Success** — setup screen disappears, tutor chat loads.

### Invalid key screen

Shown when `hasKey: true` but `isValid: false`:
- Shows the key preview (`...xK9m`).
- Explains the key was likely revoked or deleted.
- Input field for a new key + "Update Key" button.
- "Remove Key" button as secondary action.

### Profile page — API Key card

New card on `/dashboard/profile`:

- Shows provider (Google Gemini), preview, status badge (Active / Invalid).
- "Update Key" opens a dialog with the same validation flow.
- "Remove Key" triggers confirmation dialog: "Remove your API key? The tutor will be unavailable until you add a new one." Then calls `DELETE /api/profile/api-key` with `{ confirm: true }`.

### QuotaIndicator

Hides entirely for BYOAK users (no daily cap). Per-minute rate limit only surfaces as a 429 error on the rare occasion someone hits it.

### Client error handling in TutorPanel

`onError` handler gains two new cases:
- `API_KEY_REQUIRED` -> switch to setup screen.
- `API_KEY_INVALID` -> switch to invalid-key screen, refetch key status.

---

## 5. What changes, what doesn't

| Concern | Change |
|---|---|
| Tutor model (`lib/ai/model.ts`) | `tutorModel()` accepts an optional API key param, creates a per-request instance |
| `/api/chat` route | Fetches + decrypts user key, passes to model, handles 401 invalidation |
| `TutorPanel` component | New setup/invalid-key screens, conditional rendering based on key status |
| `QuotaIndicator` | Hidden when user has a key (no daily cap) |
| Profile page | New API Key management card |
| Rate limiting (`lib/rate/guard.ts`) | Daily cap skipped for BYOAK users. Per-minute cap stays. |
| Lesson/exercise generation | No change. Uses platform Anthropic key. |
| `lib/anthropic/client.ts` | No change. |
| Cost tracking (`token_usage`) | Still logged for analytics, but cost is on user's key. |

---

## 6. New env var

```
API_KEY_ENCRYPTION_SECRET=<base64-encoded 32-byte random key>
```

Generate with: `openssl rand -base64 32`

Set in Vercel dashboard only. Add placeholder to `.env.example`. Never commit the real value.
