# AI Tutor Rebuild — Design Spec

Rebuild the cpproad AI tutor on Gemini 2.5 Flash via Vercel AI SDK, replacing the existing Anthropic-based SSE tutor. Lesson/exercise generation stays on Anthropic (Sonnet/Haiku). The tutor gains rate limiting, budget caps, feedback, conversation reset, and an "explain this error" shortcut.

Approach: **incremental rebuild** — replace layer by layer, each step independently testable. Delete old tutor code after the new path is validated.

---

## 1. Architecture

```
Browser
  LessonClient
    ├── EditorRegion (Monaco, unchanged)
    ├── OutputPanel (Judge0 results, unchanged)
    ├── ResizableDivider (draggable split pane handle)
    └── TutorPanel (useChat + streamText)
         ├── MessageList → MarkdownMessage + FeedbackButtons
         ├── Composer (input + send + stop)
         ├── QuotaIndicator
         └── ExplainErrorButton

  Zustand store: code, lessonId, lastSubmissionToken, lastSubmissionStatus

Vercel (Next.js Route Handlers)
  POST /api/chat           ← streamText + google('gemini-2.5-flash')
  POST /api/chat/feedback  ← thumbs up/down
  POST /api/chat/reset     ← archive conversation
  GET  /api/chat/quota     ← daily usage count + month spend

  lib/ai/
    model.ts         ← google('gemini-2.5-flash') factory
    system-prompt.ts ← pinned cacheable block builder
    context.ts       ← assemble + trim (lesson + code + judge0 + history)
    pricing.ts       ← token→USD for Gemini + existing Anthropic models
    config.ts        ← all tutor config from env vars
  lib/rate/guard.ts  ← daily/min/budget checks (pure function)

External
  Supabase (Postgres + RLS) — conversations, messages, token_usage
  Judge0 (read only — fetch cached submission result by token)
  Gemini 2.5 Flash (via Vercel AI SDK google provider)
```

**Key invariant:** `lib/anthropic/` and all lesson/exercise generation code stays untouched. `lib/ai/` is tutor-only.

---

## 2. API Design

### `POST /api/chat`

Replaces `/api/tutor`. Uses Vercel AI SDK `streamText` + `toUIMessageStreamResponse()`.

**Request body** (sent by `useChat`):
```ts
{
  messages: UIMessage[];
  lessonId: string;
  code: string;
  lastSubmissionToken?: string;
}
```

**Server flow:**
1. `getUser()` from Supabase server client → 401 if absent.
2. Validate body with Zod, reject > 64 KB.
3. `checkRateAndBudget()` — daily count, per-minute count, monthly spend, conversation spend → 429 if over limit.
4. Resolve/create conversation for `(userId, lessonId)` — one active per lesson.
5. Compute hint tier from conversation turn count (existing 4-tier logic).
6. Assemble context: lesson metadata + editor code (≤8KB) + Judge0 result (if token) + last 10 messages. Trim to 12k token budget (oldest messages first).
7. `streamText({ model: google('gemini-2.5-flash'), system: pinnedBlock, messages, maxOutputTokens: 1024, abortSignal: AbortSignal.timeout(30_000) })`.
8. Return `result.toUIMessageStreamResponse()`.
9. Persist user message to DB immediately (before streaming begins).
10. `onFinish`: persist assistant message (with hint tier), insert `token_usage` row (with `conversation_id`), update conversation `updated_at`.

### `POST /api/chat/feedback`

Body: `{ messageId: string, value: 'up' | 'down' }`. Updates `messages.feedback`. Auth required.

### `POST /api/chat/reset`

Body: `{ lessonId: string }`. Sets current active conversation to `status = 'archived'`. Next message creates a new conversation. Auth required.

### `GET /api/chat/quota`

Returns: `{ usedToday: number, dailyCap: number, monthSpendUsd: number, monthCapUsd: number }`. Auth required.

### Error contract

Every error returns `{ error: { code, message } }`:
- `UNAUTHENTICATED` (401)
- `RATE_LIMITED` (429) — daily or per-minute cap
- `BUDGET_EXCEEDED` (429) — monthly or per-conversation cap
- `BAD_REQUEST` (400) — validation failure
- `UPSTREAM` (502) — Gemini error/timeout

### Deleted after validation

- `/api/tutor/route.ts`

### Kept as-is

- `/api/conversations` and `/api/conversations/[id]` (used by dashboard/stats)

---

## 3. Frontend Components

### Zustand Store (`lib/store/tutor-store.ts`)

```ts
interface TutorStore {
  lessonId: string;
  code: string;
  lastSubmissionToken: string | null;
  lastSubmissionStatus: string | null;
  setCode: (code: string) => void;
  setSubmissionResult: (token: string, status: string) => void;
}
```

`LessonClient` writes on editor change / submission complete. `TutorPanel` reads to attach context to each `useChat` message via `body`.

### Component Tree

```
LessonClient (existing, modified for Zustand + resizable layout)
├── EditorRegion (existing Monaco, writes code to store)
├── OutputPanel (existing, writes submission result to store)
├── ResizableDivider (NEW)
└── TutorPanel (NEW, replaces ChatPanel)
    ├── TutorHeader
    │   ├── Title + TierBadge (existing component)
    │   ├── QuotaIndicator (NEW)
    │   └── ResetButton (NEW)
    ├── MessageList
    │   └── MessageBubble (per message)
    │       ├── MarkdownMessage (markdown + C++ syntax highlighting)
    │       ├── TierBadge (on assistant messages)
    │       └── FeedbackButtons (NEW: thumbs up/down)
    ├── ExplainErrorButton (NEW: visible when last submission failed)
    └── Composer
        ├── TextInput (auto-resize textarea)
        ├── SendButton
        └── StopButton (visible during streaming)
```

### Resizable Split Pane

- CSS-based with a draggable handle, no library dependency.
- Default split: 60% editor / 40% tutor.
- Min width: 300px per pane.
- Handle: 4px wide, `var(--color-border)`, cursor `col-resize`.
- Mobile (< 768px): stack vertically, tutor collapses to a bottom sheet.

### UI Design Tokens (homepage-consistent)

All tutor UI uses the homepage design system tokens from `homepage-specs/design.md`:

- Panel background: `var(--color-surface)` (#0f1115)
- User message bubbles: `var(--color-surface-2)` (#161b22)
- Assistant messages: transparent background
- Borders: `var(--color-border)` (#23262d) hairlines
- Text: `var(--color-fg)` (#ededed) primary, `var(--color-fg-muted)` (#8b949e) secondary
- Accent: `var(--color-accent)` (#2f81f7) for links, active states, tier badges
- Code blocks in messages: `var(--color-surface)` bg, Geist Mono, syntax highlighting using homepage code tokens (`--code-keyword`, `--code-string`, `--code-func`, etc.)
- Primary buttons: solid #ffffff fill, #000 text (Vercel signature)
- Secondary buttons: transparent, `1px solid var(--color-border-strong)`, `var(--color-fg)` text
- Radius: `var(--radius-md)` (8px) on cards/bubbles, `var(--radius-sm)` (6px) on buttons
- Font: Geist Sans for text, Geist Mono for code

### Key Behaviors

- **Streaming:** `useChat` renders `message.parts` incrementally. Markdown via `react-markdown` + syntax highlighting via `react-syntax-highlighter` (already installed).
- **Explain Error:** When `lastSubmissionStatus !== 'accepted'`, show a pill button. Clicking calls `useChat.append()` with a pre-filled message asking the tutor to explain the error.
- **Feedback:** Thumbs up/down icons appear on hover over assistant messages. Click sends `POST /api/chat/feedback`.
- **Quota:** Shows "X/50 messages today" when usage ≥ 80% of daily cap. At cap, input disabled with friendly message.
- **Stop:** During streaming, send button becomes stop button calling `useChat.stop()`.
- **Thinking indicator:** "Tutor is thinking..." shown before first token arrives.
- **Reset:** Button in header archives conversation and clears `useChat` messages.

---

## 4. Database Schema Changes

### Migration: `0002_tutor_rebuild.sql`

Three alterations to existing tables. No new tables.

**1. `conversations` — add `status` for conversation reset:**
```sql
ALTER TABLE conversations ADD COLUMN status text NOT NULL DEFAULT 'active';
CREATE UNIQUE INDEX idx_conversations_active
  ON conversations (user_id, lesson_id) WHERE status = 'active';
```

**2. `messages` — add `feedback` for thumbs up/down:**
```sql
ALTER TABLE messages ADD COLUMN feedback text;
```

**3. `token_usage` — add `conversation_id` for per-conversation cost tracking:**
```sql
ALTER TABLE token_usage ADD COLUMN conversation_id uuid
  REFERENCES conversations(id) ON DELETE SET NULL;
CREATE INDEX idx_token_usage_conversation ON token_usage (conversation_id);
```

### Key queries

| Purpose | Query |
|---|---|
| Daily message count | `SELECT count(*) FROM messages WHERE user_id = $1 AND created_at >= date_trunc('day', now())` |
| Per-minute count | `SELECT count(*) FROM messages WHERE user_id = $1 AND created_at >= now() - interval '1 minute'` |
| Monthly spend | `SELECT coalesce(sum(cost_usd_micro), 0) FROM token_usage WHERE created_at >= date_trunc('month', now())` (cached ~60s) |
| Per-conversation spend | `SELECT coalesce(sum(cost_usd_micro), 0) FROM token_usage WHERE conversation_id = $1` |

RLS policies already exist and scope all tables to `auth.uid()`. No new policies needed.

---

## 5. Rate Guard, System Prompt & Cost Tracking

### Rate and Budget Guard (`lib/rate/guard.ts`)

Pure function — no I/O, fully unit-testable:

```ts
interface GuardResult {
  allowed: boolean;
  code?: 'RATE_LIMITED' | 'BUDGET_EXCEEDED' | 'CONVERSATION_LIMIT';
  message?: string;
}

function checkRateAndBudget(params: {
  dailyCount: number;
  minuteCount: number;
  monthSpendMicro: number;
  conversationSpendMicro: number;
}): GuardResult
```

Checks in order: per-minute → daily → per-conversation → monthly hard cap. At monthly soft cap ($30), logs `console.warn` and sets a dashboard flag.

### Config Module (`lib/ai/config.ts`)

Single source of truth for tutor configuration:

```ts
export const TUTOR_CONFIG = {
  dailyMsgCap: Number(env.TUTOR_DAILY_MSG_CAP ?? 50),
  perMinMsgCap: Number(env.TUTOR_PER_MIN_MSG_CAP ?? 8),
  monthlyHardCapMicro: Number(env.TUTOR_MONTHLY_HARD_CAP_USD ?? 50) * 1_000_000,
  monthlySoftCapMicro: Number(env.TUTOR_MONTHLY_SOFT_CAP_USD ?? 30) * 1_000_000,
  maxConvoCostMicro: Number(env.TUTOR_MAX_CONVO_COST_USD ?? 0.05) * 1_000_000,
  contextTokenBudget: Number(env.TUTOR_CONTEXT_TOKEN_BUDGET ?? 12000),
  maxOutputTokens: Number(env.TUTOR_MAX_OUTPUT_TOKENS ?? 1024),
} as const;
```

### System Prompt (`lib/ai/system-prompt.ts`)

Static instruction header (cacheable) + dynamic context (per-request):

```
You are the cpproad C++ tutor. Your job is to unblock and teach, not hand over answers.

[PEDAGOGY]
- Favor Socratic questions and minimal illustrative snippets.
- Never produce a full working solution to the lesson exercise.
- Give the next conceptual step, not the final answer.
- Decode compiler/runtime errors in plain language before suggesting fixes.
- Redirect non-C++ requests back to the lesson.

[HINT TIER: {tier}]
{tier_instruction — varies by tier 1-4}

[CURRENT LESSON]
Chapter: {chapter_title}
Lesson: {lesson_title}

[LEARNER CODE] (≤8KB, truncated with marker)
```cpp
{editor_buffer}
```

[LAST EXECUTION] (omit if none)
Status: {status}
Compile output: {compile_output | none}
stderr: {stderr | none}
stdout (truncated): {stdout}
```

Tier instructions:
- **Tier 1:** Ask a diagnostic question to help the learner find the issue themselves.
- **Tier 2:** Name the missing concept and point to the relevant lesson section.
- **Tier 3:** Sketch the approach in pseudocode without giving compilable C++.
- **Tier 4:** Show a working snippet with a line-by-line explanation.

Tier computation (preserved from existing implementation):
- T1 by default
- T2 at 3+ conversation turns
- T3 at 5+ turns
- T4 at 7+ turns OR if user message contains "show me", "give me the answer", "just tell me", "i give up"

### Cost Tracking (`lib/ai/pricing.ts`)

Extends existing pricing with Gemini rates:

```ts
const PRICING = {
  'claude-sonnet-4-6':  { input: 3.0, output: 15.0, cachedInput: 2.7 },
  'claude-haiku-4-5':   { input: 1.0, output: 5.0,  cachedInput: 0.9 },
  'gemini-2.5-flash':   { input: 0.15, output: 0.60, cachedInput: 0.04 },
} // USD per 1M tokens
```

`onFinish` from `streamText` provides `usage.promptTokens` and `usage.completionTokens`. Cost computed in microdollars and inserted into `token_usage` with `call_type = 'tutor'` and `conversation_id`.

---

## 6. Dependencies

### New packages
- `ai` — Vercel AI SDK core
- `@ai-sdk/google` — Google Gemini provider
- `@ai-sdk/react` — `useChat` hook
- `zustand` — client state store

### Existing (no changes)
- `@anthropic-ai/sdk` — lesson/exercise generation (untouched)
- `react-markdown`, `react-syntax-highlighter` — message rendering
- `@monaco-editor/react` — code editor
- `@supabase/supabase-js` — database + auth

---

## 7. New Environment Variables

```
GOOGLE_GENERATIVE_AI_API_KEY     # Gemini API key (server-only)
TUTOR_MONTHLY_HARD_CAP_USD=50
TUTOR_MONTHLY_SOFT_CAP_USD=30
TUTOR_DAILY_MSG_CAP=50
TUTOR_PER_MIN_MSG_CAP=8
TUTOR_MAX_CONVO_COST_USD=0.05
TUTOR_CONTEXT_TOKEN_BUDGET=12000
TUTOR_MAX_OUTPUT_TOKENS=1024
```

All server-only. Defaults baked into `lib/ai/config.ts` so the app runs without explicit env vars in development.

---

## 8. Error Handling

- **Gemini timeout/error:** 30s `AbortSignal.timeout`, single retry on transient 5xx/429 from provider. On failure, return `{ error: { code: 'UPSTREAM', message: 'The tutor is briefly unavailable. Your editor and lessons still work.' } }`.
- **Partial stream failure:** If the stream fails mid-response, persist whatever assistant text was received (marked incomplete) and still record usage for tokens billed.
- **Budget/rate limit:** Return friendly message with error code. Input field disabled with explanation. Editor and course remain fully functional.
- **Missing Judge0 result:** If token is missing or expired, context omits the execution section with an explicit "no recent run" note rather than failing the request.
- **Client resilience:** `useChat`'s `onError` maps each error code to a specific inline message. The panel never throws to a blank screen.

---

## 9. What stays untouched

- `lib/anthropic/` — client, prompts, cache helpers, cost logging
- `lib/content/` — lesson generation, exercise generation
- `lib/judge0/` — submission client, verdict logic
- `lib/auth/` — require-auth middleware
- `app/api/lessons/`, `app/api/submissions/`, `app/api/progress/` — all existing routes
- `components/editor/MonacoEditor.tsx` — editor component
- `components/lesson/OutputPanel.tsx` — output display
- Homepage and marketing pages

---

## 10. Scope Summary

| Area | Change |
|---|---|
| New deps | `ai`, `@ai-sdk/google`, `@ai-sdk/react`, `zustand` |
| New files | `lib/ai/` (5 files), `lib/rate/guard.ts`, `lib/store/tutor-store.ts`, `app/api/chat/` (4 route files), `components/tutor/` (8 component files) |
| Modified files | `LessonClient.tsx` (Zustand + resizable layout), `package.json` |
| New migration | `0002_tutor_rebuild.sql` (3 ALTER TABLEs + indexes) |
| Deleted after validation | `/api/tutor/route.ts`, old `components/tutor/ChatPanel.tsx` |
| Untouched | `lib/anthropic/`, lesson gen, exercise gen, Judge0, auth, homepage |
