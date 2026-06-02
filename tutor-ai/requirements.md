# requirements.md — cpproad AI Tutor

Functional and non-functional requirements. Each has a unique ID and priority: **P0** = launch blocker, **P1** = needed soon after launch, **P2** = nice-to-have.

Stack assumptions: Next.js App Router on Vercel, Supabase Auth + Postgres (RLS), Judge0 for execution, Vercel AI SDK v5, Gemini 2.5 Flash default. EARS = Easy Approach to Requirements Syntax ("The system shall…").

---

## 1. User stories

- **US-1 (P0)** — As a C++ beginner, I want to ask the tutor about a compiler error so I understand what it means without leaving the editor.
- **US-2 (P0)** — As a learner, I want the tutor to already know which lesson I'm on so I don't have to re-explain context.
- **US-3 (P0)** — As a learner, I want the tutor to see the code currently in my editor so its advice matches what I actually wrote.
- **US-4 (P0)** — As a learner, I want replies to stream in real time so I'm not staring at a spinner.
- **US-5 (P1)** — As a learner, I want my past conversation in a lesson to persist so I can pick up where I left off.
- **US-6 (P1)** — As a learner, I want the tutor to nudge me toward the answer rather than hand it over, so I actually learn.
- **US-7 (P1)** — As a learner, I want to give thumbs-up/down on a reply so the tutor improves.
- **US-8 (P0)** — As the operator, I want hard cost and rate limits so a few users (or abuse) can't blow the budget.
- **US-9 (P2)** — As a learner, I want to clear/reset a conversation for a lesson.

---

## 2. Functional requirements

### 2.1 Context awareness

- **FR-CTX-1 (P0)** — The system shall include the learner's current course section (id, title, tier, and learning objectives) in the model context for every tutor request.
- **FR-CTX-2 (P0)** — The system shall include the current contents of the learner's code editor buffer in the model context when the learner sends a message.
- **FR-CTX-3 (P0)** — When a Judge0 submission for the current editor buffer exists, the system shall include the latest Judge0 result (status description, `compile_output`, `stderr`, truncated `stdout`, time, memory) in the model context.
- **FR-CTX-4 (P0)** — The system shall assemble all section/code/execution context **server-side**; the client shall never construct the system prompt.
- **FR-CTX-5 (P1)** — The system shall include the last N turns of the current conversation (default N = 10 messages) as history, trimming oldest-first when the assembled context would exceed the token budget (FR-COST-3).
- **FR-CTX-6 (P1)** — The system shall truncate any single context field exceeding its cap: editor buffer to 8 KB, each Judge0 stream to 4 KB, with a clear `…[truncated]` marker.
- **FR-CTX-7 (P2)** — The system shall include the learner's progress signal for the current tier (sections completed) when available, to calibrate explanation depth.

### 2.2 Conversation and chat

- **FR-CHAT-1 (P0)** — The system shall expose a `POST /api/chat` route handler that accepts the message history and current editor/section context and returns a streamed assistant response.
- **FR-CHAT-2 (P0)** — The system shall stream assistant tokens to the client using the Vercel AI SDK (`streamText` → `toUIMessageStreamResponse()`), consumed by `useChat`.
- **FR-CHAT-3 (P0)** — The system shall persist every user and assistant message to Supabase, scoped to the authenticated user and the active conversation.
- **FR-CHAT-4 (P1)** — The system shall create exactly one conversation per (user, course_section) pair on first message, and reuse it thereafter.
- **FR-CHAT-5 (P1)** — The system shall let a learner reset the conversation for the current section, archiving (soft-deleting) prior messages.
- **FR-CHAT-6 (P1)** — The system shall record thumbs-up/down feedback against a specific assistant message.

### 2.3 Tutoring behavior (pedagogy)

- **FR-PED-1 (P0)** — The system shall instruct the model, via a pinned system prompt, to favor Socratic guidance and minimal illustrative snippets over complete solutions.
- **FR-PED-2 (P0)** — The system shall instruct the model to refuse to produce a full working solution to a course exercise and instead provide the next conceptual step.
- **FR-PED-3 (P1)** — The system shall instruct the model to decode Judge0 compiler/runtime errors in plain language before suggesting fixes.
- **FR-PED-4 (P1)** — The system shall instruct the model to redirect clearly off-topic (non-C++-learning) requests back to the lesson.
- **FR-PED-5 (P2)** — The system shall adapt explanation depth to the learner's tier (beginner ⇒ more scaffolding; advanced ⇒ idiomatic/design-level feedback).

### 2.4 Cost and rate control

- **FR-COST-1 (P0)** — The system shall record, per request, input tokens, output tokens, model id, and computed USD cost in a `usage_events` table, written from the AI SDK `onFinish` callback.
- **FR-COST-2 (P0)** — The system shall enforce a per-user daily message cap (default 50/day) and per-user rate limit (default 8/min); requests over the limit return HTTP 429 with a friendly message.
- **FR-COST-3 (P0)** — The system shall cap assembled input context at a configurable token budget (default 12,000 tokens) and `maxOutputTokens` (default 1,024), trimming history first (FR-CTX-5).
- **FR-COST-4 (P0)** — The system shall compute current-month aggregate spend and, when it reaches the hard cap (default $50), disable new tutor generations and return the degraded-mode message (NFR-REL-3).
- **FR-COST-5 (P1)** — The system shall emit an alert when monthly spend crosses the soft threshold (default $30).
- **FR-COST-6 (P1)** — The system shall use provider prompt caching for the static system-prompt block to reduce repeated input cost.

### 2.5 UI / UX

- **FR-UI-1 (P0)** — The system shall present the tutor as a dockable side panel using shadcn **`Sheet`** (desktop, `side="right"`) or **`Drawer`** (mobile) adjacent to the editor, not a separate page.
- **FR-UI-2 (P0)** — The system shall render streamed assistant text incrementally in a shadcn **`ScrollArea`** and render Markdown, including syntax-highlighted C++ code blocks.
- **FR-UI-3 (P0)** — The system shall show a clear "tutor is thinking" state (shadcn **`Skeleton`** lines) before the first token and a stop-generation control (shadcn `Button variant="destructive"`) during streaming.
- **FR-UI-4 (P1)** — The system shall show a one-tap "Explain this error" action (shadcn `Button variant="outline"`) when a failed Judge0 result is present, pre-filling a message.
- **FR-UI-5 (P1)** — The system shall display remaining daily message quota (shadcn **`Progress`** bar + **`Badge`**) when the user is within 20% of the cap.
- **FR-UI-6 (P1)** — The system shall expose thumbs-up/down controls (shadcn `Button variant="ghost" size="icon"`) on each assistant message.
- **FR-UI-7 (P0)** — The system shall keep the editor and course usable when the tutor panel errors or is rate-limited. Use shadcn **`Sonner`** (`toast.error()`) for transient error feedback.

### 2.6 Auth and access

- **FR-AUTH-1 (P0)** — The system shall reject any `/api/chat` request without a valid Supabase session (HTTP 401).
- **FR-AUTH-2 (P0)** — The system shall enforce Supabase RLS so a user can read/write only their own conversations, messages, and usage rows.
- **FR-AUTH-3 (P0)** — The system shall derive `user_id` from the verified server-side session, never from the request body.

---

## 3. Non-functional requirements

### 3.1 Performance

- **NFR-PERF-1 (P0)** — Time-to-first-token shall be ≤ 1.5 s at median, ≤ 3 s at p95.
- **NFR-PERF-2 (P0)** — Full response shall complete ≤ 6 s median for typical (≤ 1,024 output token) replies.
- **NFR-PERF-3 (P1)** — The system shall support ≥ 50 concurrent active conversations without degradation beyond NFR-PERF-1/2 (serverless route handlers scale per-request; the bound is provider rate limit, not app compute).
- **NFR-PERF-4 (P1)** — Judge0 result fetch for context shall use the most recent cached submission result; the chat path shall not trigger a new compilation.

### 3.2 Cost

- **NFR-COST-1 (P0)** — Average cost per conversation shall be ≤ $0.01; no conversation shall exceed $0.05.
- **NFR-COST-2 (P0)** — Monthly tutor inference spend shall not exceed the configurable hard cap (default $50).

### 3.3 Security and privacy

- **NFR-SEC-1 (P0)** — All provider and Judge0 API keys shall exist only in server-side environment variables, never shipped to the client or committed to source.
- **NFR-SEC-2 (P0)** — All user input (code, messages) shall be transmitted over TLS and treated as untrusted; it shall be passed as data, never interpolated into executable server logic.
- **NFR-SEC-3 (P0)** — Conversation and code content shall not be sent to any third party other than the chosen model provider, and shall not appear in client-side analytics or logs.
- **NFR-SEC-4 (P1)** — Logs shall redact message/code bodies; only metadata (ids, token counts, latency, status) may be logged.
- **NFR-SEC-5 (P0)** — The system shall validate and size-limit the request body (reject > 64 KB) before processing.

### 3.4 Reliability

- **NFR-REL-1 (P0)** — On provider error/timeout, the system shall return a friendly fallback message and a non-5xx-crash client state.
- **NFR-REL-2 (P1)** — Provider calls shall use a 30 s timeout and a single retry on transient (5xx/429-from-provider) errors with backoff.
- **NFR-REL-3 (P0)** — In degraded mode (budget/rate/outage), the tutor shall return a clear explanation and the editor/course shall remain fully functional.

### 3.5 Accessibility / quality of experience

- **NFR-A11Y-1 (P1)** — The chat panel shall be keyboard-navigable, screen-reader labeled, and meet WCAG 2.1 AA contrast.
- **NFR-A11Y-2 (P2)** — Streaming output shall be announced politely to assistive tech without flooding it.

---

## 4. Traceability summary

| Theme | Requirements | Drives design section |
|---|---|---|
| Context injection | FR-CTX-1..7 | Context Management Strategy |
| Streaming chat | FR-CHAT-1..2, FR-UI-1..3 | API Design, Frontend Components |
| Persistence | FR-CHAT-3..6, FR-AUTH-2 | Database Schema |
| Pedagogy | FR-PED-1..5 | System Prompt design |
| Cost/limits | FR-COST-1..6, NFR-COST-* | Cost Controls, Usage schema |
| Security | FR-AUTH-1..3, NFR-SEC-* | API Design, RLS |
