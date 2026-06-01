# requirements.md — cpproad

> Requirements for a consumer-facing C++ learning platform. Every requirement is testable.

**Priority legend:**
- **P0** — Won't ship without it.
- **P1** — Add as I go.
- **P2** — Maybe never.

---

## 1. Functional Requirements

### 1.1 Curriculum & Roadmap

| ID | Req | Priority |
|---|---|---|
| **FR-001** | The system shall load the chapter and lesson structure from `curriculum_seed.json` into Supabase on first boot. | P0 |
| **FR-002** | The system shall display a roadmap view showing all chapters and lessons in their canonical order, with completion state per lesson. | P0 |
| **FR-003** | The system shall let me navigate to any lesson by clicking it on the roadmap. | P0 |
| **FR-004** | The system shall let me mark a lesson "skipped" (counted as known, not completed). | P1 |
| **FR-005** | The system shall display a "Continue where I left off" CTA on the home view linking to the most recent in-progress lesson. | P1 |
| **FR-006** | The system shall let me filter the roadmap by topic tag (`pointers`, `templates`, `c++20`, etc.) once tags exist on lessons. | P2 |
| **FR-007** | The system shall render the lesson number, title, and (optionally) a "Further reading: learncpp.com" link at the bottom of every lesson page. | P0 |

### 1.2 Lesson Content (LLM-Generated, Cached)

| ID | Req | Priority |
|---|---|---|
| **FR-020** | On first visit to a lesson with no cached content, the system shall request the LLM to generate the lesson summary and store it in Postgres before rendering. | P0 |
| **FR-021** | On every subsequent visit, the system shall load the cached summary directly from Postgres without calling the LLM. | P0 |
| **FR-022** | The lesson summary shall be 250–400 words of markdown including exactly one short original code example (≤ 15 lines, modern C++20). | P0 |
| **FR-023** | On first visit to a lesson with no cached exercises, the system shall request the LLM to generate 1–3 exercises with starter code, problem statement, and at least 3 test cases each. | P0 |
| **FR-024** | Generated exercises and test cases shall be persisted permanently to Postgres. | P0 |
| **FR-025** | The system shall provide a "Regenerate this lesson" admin button (visible only to me) that deletes the cached content and triggers fresh generation. | P1 |
| **FR-026** | The system shall let me edit a lesson summary or exercise in place via an inline markdown editor. | P1 |
| **FR-027** | LLM prompts for lesson generation shall NOT include any learncpp.com page content. They include only the lesson title, chapter context, prior lesson titles, and topic tags. | P0 |

### 1.3 Code Editor & Execution

| ID | Req | Priority |
|---|---|---|
| **FR-040** | The system shall provide a Monaco editor with C++ syntax highlighting on every exercise page. | P0 |
| **FR-041** | The system shall preserve in-progress editor content in browser local storage so a refresh doesn't lose code. | P0 |
| **FR-042** | The system shall provide a "Run" button that submits the current code to Judge0 with the exercise's stdin and displays stdout, stderr, exit code, and wall time. | P0 |
| **FR-043** | The system shall provide a "Submit" button that runs the code against every test case and reports pass/fail per case with diffs. | P0 |
| **FR-044** | The system shall provide a "Reset to starter code" button with confirmation. | P0 |
| **FR-045** | The system shall compile with `g++ -std=c++20 -Wall -Wextra` by default, with a dropdown to switch to C++17 or C++23. | P0 |
| **FR-046** | The system shall enforce 5s CPU time, 256MB memory, 100KB stdout limits per execution. | P0 |
| **FR-047** | The system shall persist every submission to Postgres with status, output, and verdict for later review. | P0 |
| **FR-048** | The system shall keyboard-shortcut Cmd/Ctrl+Enter to Run and Cmd/Ctrl+Shift+Enter to Submit. | P1 |
| **FR-049** | The system shall show me my last passing submission for each exercise on the exercise page. | P1 |

### 1.4 AI Tutor

| ID | Req | Priority |
|---|---|---|
| **FR-060** | The system shall provide a chat panel on every lesson page where the user can ask the tutor questions about the current lesson. | P0 |
| **FR-061** | The system shall include the lesson summary, current exercise prompt, my current editor code, and last execution output in tutor prompts automatically. | P0 |
| **FR-062** | The system shall stream tutor responses token-by-token via SSE. | P0 |
| **FR-063** | The system shall implement a 4-tier hint policy: T1 ask a guiding question, T2 name the missing concept, T3 sketch the approach in pseudocode, T4 (only on explicit "show me") reveal a working snippet. | P0 |
| **FR-064** | The system shall persist every tutor message (mine and the assistant's) to Postgres. Revisiting an old conversation loads from the cache without calling the LLM. | P0 |
| **FR-065** | The system shall provide a "New conversation on this lesson" button that starts a fresh tutor context. | P1 |
| **FR-066** | The system shall provide a "Regenerate this response" button on the latest assistant message. | P1 |
| **FR-067** | The system shall use Sonnet 4.6 for tutor turns by default, with a small UI toggle to switch to Haiku 4.5 for cheaper iteration. | P1 |
| **FR-068** | The system shall enforce Anthropic prompt caching on the system prompt + lesson context blocks. | P0 |

### 1.5 Progress

| ID | Req | Priority |
|---|---|---|
| **FR-080** | The system shall track per-lesson state (not_started / in_progress / completed / skipped) and update on submission verdicts. | P0 |
| **FR-081** | A lesson auto-promotes to "in_progress" the first time I open it. | P0 |
| **FR-082** | A lesson auto-promotes to "completed" when I pass at least one exercise from it. | P0 |
| **FR-083** | The system shall display a per-chapter completion percentage on the roadmap. | P1 |
| **FR-084** | The system shall display total stats (lessons completed, exercises solved, days streak) on a simple stats page. | P1 |

### 1.6 Auth & User Management

| ID | Req | Priority |
|---|---|---|
| **FR-100** | The system shall use Supabase Auth (email + magic link) for sign-in and sign-up. | P0 |
| **FR-101** | The system shall require authentication on all non-public routes, enforced server-side. | P0 |
| **FR-102** | Unauthenticated requests to protected routes shall return 401. | P0 |
| **FR-103** | The system shall support open signup — any user can create an account. | P0 |

### 1.7 Cost & Telemetry

| ID | Req | Priority |
|---|---|---|
| **FR-120** | The system shall log every Anthropic API call's input tokens, output tokens, cache-hit status, and computed dollar cost to a `token_usage` table. | P0 |
| **FR-121** | The system shall expose a `/stats/costs` page summarizing monthly LLM spend, with cache hit rate. | P1 |
| **FR-122** | The system shall log every code execution's wall time and verdict to a `submissions` table. | P0 |

---

## 2. Non-Functional Requirements

### 2.1 Performance

| ID | Req | Threshold |
|---|---|---|
| **NFR-001** | Cached lesson page render (no LLM call) | < 500ms TTFB |
| **NFR-002** | First-visit lesson generation (with LLM call) | < 8s p50, < 15s p95 |
| **NFR-003** | Code compile + run round-trip for typical exercise | < 3s p50, < 6s p95 |
| **NFR-004** | Tutor first-token latency (streaming) | < 1.5s p50 |
| **NFR-005** | Monaco editor initial mount and ready to type | < 1s |

### 2.2 Cost

| ID | Req | Threshold |
|---|---|---|
| **NFR-020** | Total monthly all-in spend (Anthropic + Fly.io + Supabase + Vercel) | < $30/month |
| **NFR-021** | Anthropic prompt caching enabled on all calls with reusable context | required |
| **NFR-022** | Cache hit ratio on lesson summaries after first full pass through curriculum | 100% (no cache miss on revisit) |

### 2.3 Security (Code Execution)

| ID | Req | Priority |
|---|---|---|
| **NFR-040** | Code execution runs in a sandbox isolated from the app — separate VM, separate process tree. | P0 |
| **NFR-041** | Sandbox container runs as non-root, with `--security-opt=no-new-privileges`. | P0 |
| **NFR-042** | Sandbox container has `--network=none` — no outbound network from inside the sandbox. | P0 |
| **NFR-043** | Sandbox container has a read-only root filesystem; only `/tmp` is writable. | P0 |
| **NFR-044** | Sandbox uses gVisor as the container runtime (not the default runc). | P0 |
| **NFR-045** | Judge0 is pinned to a version patched against CVE-2024-29021. | P0 |
| **NFR-046** | Submissions exceeding 50KB of source code are rejected at the API layer. | P0 |

### 2.4 Reliability

| ID | Req | Threshold |
|---|---|---|
| **NFR-060** | Daily Supabase backups enabled (built-in). | required |
| **NFR-061** | Judge0 VM auto-restarts on health-check failure. | required |
| **NFR-062** | LLM call failures degrade gracefully — show "tutor unavailable, try Run instead" rather than crash the page. | required |
| **NFR-063** | If the Anthropic API is rate-limited or down, cached content for already-visited lessons remains accessible. | required |

### 2.5 Mobile / Responsive

| ID | Req | Priority |
|---|---|---|
| **NFR-080** | Lesson reading pages shall be usable on viewports ≥ 360px wide. | P1 |
| **NFR-081** | The code editor on narrow viewports shall be read-only with a "use desktop" message. | P1 |

---

## 3. Explicit Exclusions

To prevent scope creep in v1:

- **EX-01:** No real-time collaboration, comments, or sharing between users.
- **EX-02:** No certificates or credentials.
- **EX-03:** No multi-file C++ projects in v1. Single `main.cpp` per exercise.
- **EX-04:** No language servers, full IntelliSense, or in-browser debugger.
- **EX-05:** No native mobile apps.
- **EX-06:** No re-scraping schedule. The seed script runs once. Manual re-run if learncpp adds chapters.

---

## 4. Done Criteria for v1

The app is "v1 done" when a user can:

1. Sign up and sign in via magic link
2. See the roadmap with all 345 lessons from the seed
3. Click into any lesson and have it generated on first visit, cached on second
4. Write code in Monaco, hit Run, see output from Judge0
5. Hit Submit, see test case verdicts
6. Open the tutor panel, ask a question, get a streaming response that respects T1–T4 hint policy
7. Revisit a previous lesson and see all their prior tutor conversations and submissions
8. Each user's progress, submissions, and conversations are isolated via RLS
