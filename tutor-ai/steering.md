# STEERING.md — cpproad AI Tutor

> North star and decision framework for the contextual AI Tutor feature on **cpproad** (https://cpp-course-ten.vercel.app/).
> When any requirement, design choice, or tradeoff is ambiguous, resolve it against this document.

**Stack of record:** Next.js (App Router) on Vercel · Supabase (Auth + Postgres + RLS) · Judge0 (remote C++ execution) · Vercel AI SDK v5 · Google Gemini 2.5 Flash (default model).

---

## 1. Mission

Give every cpproad learner a tutor that already knows what lesson they're on and what code is in their editor, so help is instant and specific instead of generic. The tutor's job is to **unblock and teach**, not to hand over finished answers. Success means a learner gets unstuck and understands *why*, then keeps writing code themselves.

---

## 2. Target personas and core learning challenges

**P1 — The absolute beginner ("first program").**
Has never compiled C++. Pain points: cryptic compiler errors (`undefined reference`, missing `;`, header confusion), no mental model of compile→link→run. Needs plain-language decoding of Judge0 output and one small next step.

**P2 — The transitioning programmer.**
Knows Python/JS, fighting C++ specifics: pointers, references, value vs reference semantics, manual memory, the STL. Pain points: "why won't this compile when the logic is right," segfaults, dangling pointers. Needs conceptual bridges from languages they know.

**P3 — The plateaued intermediate.**
Comfortable with syntax, stuck on idiom and design: when to use templates, RAII, move semantics, which STL container fits. Needs review-style feedback and "the idiomatic way" rather than line-by-line fixes.

All three share one trait the tutor must respect: **they learn by writing code, not by reading solutions.**

---

## 3. Success metrics

| Metric | Target (first 90 days post-launch) |
|---|---|
| Tutor-assisted unblock rate (user runs code again successfully within 10 min of a tutor reply) | ≥ 55% |
| Median time-to-first-token | ≤ 1.5 s |
| Median full-response latency | ≤ 6 s |
| Conversations per active learner per week | ≥ 3 |
| Cost per conversation (avg) | ≤ $0.01 |
| Negative feedback rate (thumbs-down / responses) | ≤ 8% |
| "Gave away full solution" violations (sampled audit) | ≤ 2% of sampled replies |

Engagement and learning-outcome metrics rank above raw usage. A tutor that increases message volume but not unblock rate is failing.

---

## 4. Hard constraints

- **C1 — Budget.** AI inference for the tutor must stay under a configurable monthly hard cap (default **$50/mo**, soft alert at **$30/mo**). At the hard cap the tutor degrades gracefully (see C8), it does not silently overspend.
- **C2 — Per-conversation cost ceiling.** Average ≤ $0.01; no single conversation may exceed **$0.05** of inference spend.
- **C3 — Latency.** Time-to-first-token ≤ 1.5 s median; the UI must stream, never block on a full completion.
- **C4 — Privacy/security.** API keys live only server-side. User code and chat content are sent only to the chosen model provider over TLS, never logged in plaintext to third-party analytics, and stored in Supabase under per-user RLS.
- **C5 — Auth required.** No anonymous tutor access. Every request is tied to a Supabase `auth.uid()`.
- **C6 — Rate limits.** Per-user message caps enforced server-side (default **50 msgs/user/day**, **8 msgs/min**) to bound cost and abuse.
- **C7 — Provider continuity.** Default to Google Gemini (already in use elsewhere in the founder's stack) to reuse billing/keys/operational familiarity. Model choice must remain swappable via the Vercel AI SDK abstraction.
- **C8 — Graceful degradation.** When any limit (budget, rate, provider outage) is hit, the tutor returns a clear, friendly message and the rest of cpproad keeps working. The tutor is never a hard dependency for the editor or course.

---

## 5. Scope boundaries — what the tutor will NOT do

- **Will not write complete solutions** to course exercises or do the learner's assignment wholesale. It nudges, explains, and shows minimal illustrative snippets only.
- **Will not execute code itself.** Compilation and running are Judge0's job; the tutor only *reads* Judge0 results and the editor buffer.
- **Will not act as a general chatbot.** Off-topic requests (essays, unrelated coding, personal advice) are politely redirected to C++ learning.
- **Will not give answers to graded/quiz content** if/when graded assessments exist; it stays in "teaching" mode.
- **Will not persist or expose other users' code or conversations.** Strict per-user isolation.
- **Will not store secrets, payment data, or PII** beyond what Supabase Auth already holds.
- **Will not silently switch models or exceed budget** to "be more helpful."
- **No multi-language support at launch.** C++ only. Other languages are explicitly out of scope for v1.

---

## 6. Decision rules (use when specs conflict)

1. **Teaching > convenience.** If a faster answer means giving away the solution, choose the slower teaching path.
2. **Cost ceiling > completeness.** Trim context before exceeding C2; never exceed C1.
3. **Safety/privacy > features.** Never ship a feature that weakens C4/C5.
4. **Swappability > peak quality.** Keep the model behind the AI SDK abstraction even if a provider-specific feature would be marginally better.
5. **Degrade, don't break.** Tutor failure must never take down the editor or course.
