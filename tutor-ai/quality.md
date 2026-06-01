# QUALITY.md — cpproad AI Tutor

Implementation standards and acceptance bars. Code that does not meet the **P0**-linked bars here does not ship. Trace back to `requirements.md` IDs where noted.

---

## 1. Code quality standards

- **Language/format.** TypeScript everywhere, `strict: true`. ESLint (`next/core-web-vitals` + `@typescript-eslint/recommended`) and Prettier; CI fails on lint or format error.
- **No `any`** in tutor code paths. External/untyped boundaries (Judge0, provider responses) are validated with **Zod** and narrowed at the edge.
- **Server/client boundary.** No secret, provider key, or service-role client may be imported into a `'use client'` module. Enforce with an ESLint `no-restricted-imports` rule blocking `lib/supabase/admin` and `lib/ai/*` from client components.
- **Input validation.** Every route handler validates its body with a Zod schema before any other work; reject > 64 KB bodies (NFR-SEC-5).
- **Pure, testable context logic.** `lib/ai/context.ts`, `lib/ai/system-prompt.ts`, `lib/ai/pricing.ts`, and `lib/rate/guard.ts` are pure functions of their inputs (no hidden I/O) so they unit-test without network.
- **No magic numbers.** All caps/budgets/timeouts come from a single typed `config` module fed by env vars (Section 6 list).
- **Comments explain *why*,** not what; every pedagogy rule in the system prompt has a one-line rationale comment.

---

## 2. Testing requirements

| Layer | What | Bar |
|---|---|---|
| **Unit** | context assembly + trimming (FR-CTX-5/6), token→USD pricing (FR-COST-1), rate/budget guard logic (FR-COST-2/4), Judge0 base64 decode | ≥ 90% line coverage on `lib/`; all trim/truncation edge cases covered |
| **Integration (API)** | `/api/chat` happy path, 401 unauth, 429 rate, 429 budget, 400 oversize, 502 upstream; persistence + `usage_events` written on `onFinish` | every error code path has a test |
| **RLS** | a user cannot read/write another user's conversations, messages, or usage rows | cross-user access test must fail to read (FR-AUTH-2) |
| **Streaming** | response streams (TTFT measured), stop-generation aborts the provider call | TTFT assertion + abort assertion |
| **Pedagogy (eval)** | prompt-level checks that the tutor refuses full solutions and decodes errors (FR-PED-1/2/3) | curated 20-case eval suite; ≥ 90% pass before prompt changes merge |
| **E2E (smoke)** | sign in → open lesson → run code (Judge0) → ask tutor → streamed reply → feedback | runs in CI against preview deploy |

- Provider and Judge0 calls are **mocked** in unit/integration tests; a separate, opt-in "live" suite (skipped in CI by default) hits real providers behind a flag.
- A failing pedagogy eval **blocks** any change to `system-prompt.ts`.

---

## 3. Security checklist (all P0 unless noted)

- [ ] Provider + Judge0 + Supabase service-role keys exist only in server env vars; none referenced in any client bundle (grep the built client output in CI). (NFR-SEC-1)
- [ ] `user_id` is always derived from the verified server session, never from the request body. (FR-AUTH-3)
- [ ] RLS enabled and policy-tested on `conversations`, `messages`, `usage_events`; `course_sections` read-only to authenticated users. (FR-AUTH-2)
- [ ] `usage_events` inserts use the service-role client server-side only; service-role key never reaches the client. (Design §6)
- [ ] All request bodies Zod-validated and size-capped (64 KB). (NFR-SEC-5)
- [ ] User code/messages are passed as model *data*, never concatenated into shell, SQL, or eval paths. (NFR-SEC-2)
- [ ] Logs redact message and code bodies; only ids, token counts, latency, status logged. (NFR-SEC-4)
- [ ] Conversation/code content sent to no third party except the chosen model provider; excluded from client analytics. (NFR-SEC-3)
- [ ] Per-user daily + per-minute rate limits enforced server-side. (FR-COST-2)
- [ ] Judge0 results fetched by token over server-to-server TLS; base64 decode handles GCC's non-printable compile output safely. (Design §3)
- [ ] Dependencies pinned; CI runs `npm audit` / dependabot; no high-severity advisories at release. (P1)

---

## 4. Performance thresholds (acceptance gates)

| Metric | Gate | Source |
|---|---|---|
| Time-to-first-token | ≤ 1.5 s median, ≤ 3 s p95 | NFR-PERF-1 |
| Full response (≤1,024 out tokens) | ≤ 6 s median | NFR-PERF-2 |
| Chat path extra DB/Judge0 overhead before model call | ≤ 400 ms p95 | derived |
| Concurrent active conversations | ≥ 50 without breaching the above | NFR-PERF-3 |
| UI input→first render of user msg | ≤ 100 ms | FR-UI responsiveness |

The chat path must **not** trigger a new compilation (it reads the cached Judge0 token). Monthly-spend query is cached ~60 s so it doesn't add latency per message. (NFR-PERF-4)

---

## 5. Cost monitoring and alerting

- **Per-request accounting.** Every generation writes `usage_events` (input/output tokens, model, computed `cost_usd`) in `onFinish`. Pricing table lives in `lib/ai/pricing.ts` and is the single source of truth; update it whenever the model or rate changes. (FR-COST-1)
- **Live budget gate.** Guard computes month-to-date spend before each generation; at the **hard cap (default $50)** new generations are refused with `BUDGET_EXCEEDED` and degraded mode (NFR-REL-3). (FR-COST-4)
- **Soft alert.** At the **soft threshold (default $30)** emit an alert (email/webhook/Slack). (FR-COST-5)
- **Per-conversation guard.** Track cumulative `cost_usd` per conversation; refuse to continue any conversation over **$0.05**. (NFR-COST-1, C2)
- **Dashboards.** A simple operator view: month-to-date spend, spend by day, top users by cost, avg cost/conversation, tokens/request distribution. Avg cost/conversation must read ≤ $0.01.
- **Config, not code.** Caps/thresholds are env-driven so they tune without a redeploy of logic.

---

## 6. Privacy and data handling

- Store only what's needed: conversation/message text, section id, token counts, cost. No new PII beyond Supabase Auth.
- User code and chat content are **per-user, RLS-isolated**, and never exposed across users or to third-party analytics.
- Provide a delete path: deleting a user (Supabase) cascades to their conversations, messages, and usage rows.
- Document, in user-facing copy, that messages and the current code buffer are sent to the model provider to generate help. Keep that disclosure accurate if the provider changes.
- Redact bodies from all logs and error reports (NFR-SEC-4).

**Required env vars** (server-only unless `NEXT_PUBLIC_`):
```
GOOGLE_GENERATIVE_AI_API_KEY      # AI SDK google provider
JUDGE0_API_URL
JUDGE0_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY         # usage_events inserts only
TUTOR_MONTHLY_HARD_CAP_USD=50
TUTOR_MONTHLY_SOFT_CAP_USD=30
TUTOR_DAILY_MSG_CAP=50
TUTOR_PER_MIN_MSG_CAP=8
TUTOR_MAX_CONVO_COST_USD=0.05
TUTOR_CONTEXT_TOKEN_BUDGET=12000
TUTOR_MAX_OUTPUT_TOKENS=1024
```

---

## 7. Deployment and CI/CD

- **Pipeline (blocks merge to main):** typecheck → lint → unit → integration (mocked providers) → RLS tests → pedagogy eval → build. E2E smoke runs against the Vercel preview deploy.
- **Preview per PR.** Every PR gets a Vercel preview wired to a staging Supabase project and a sandbox Judge0 host; no production keys in preview.
- **Migrations.** Schema changes go through `supabase/migrations/`; applied in CI to staging before promotion. No manual prod schema edits.
- **Secrets** managed in Vercel/Supabase env config; never committed. CI greps the built client bundle for any secret-shaped string and fails on a hit.
- **Rollback.** Vercel instant rollback enabled; model/prompt changes are revertible independently of app code (prompt is a versioned module).

---

## 8. Error handling and fallback standards

- **Every external call is guarded.** Provider and Judge0 calls use a 30 s timeout and a single backoff retry on transient 5xx/429-from-upstream (NFR-REL-2). Failure returns `UPSTREAM` (502) with a friendly inline message, not a stack trace.
- **Degraded mode is first-class.** On budget/rate/outage the tutor returns a clear, kind message ("I've hit today's limit / I'm briefly unavailable — your editor and lessons still work"). The editor and course remain fully functional (NFR-REL-3, FR-UI-7).
- **No partial-write corruption.** If the stream fails mid-response, persist whatever assistant text was received (marked incomplete) and still record usage for tokens billed.
- **Client resilience.** `useChat`'s `onError` maps each error `code` to a specific inline message; the panel never throws to a blank screen.
- **Judge0 gaps handled.** Missing/expired token or non-Accepted status is rendered into context as an explicit "no recent successful run" note rather than failing the request.
- **Observability.** Log error `code`, latency, model, token counts, and request id (never bodies). A spike in `UPSTREAM` or `BUDGET_EXCEEDED` should be visible on the operator dashboard.

---

## 9. Definition of done (per feature)

A tutor feature is done when: requirements IDs it covers are all met; unit/integration/RLS tests pass and coverage bar holds; security checklist items for the touched area are checked; performance gates verified on preview; cost accounting writes correctly; pedagogy eval passes; and graceful-degradation path is demonstrated.
