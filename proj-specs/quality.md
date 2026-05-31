# QUALITY.md — cpproad

> Quality bar for a personal project. Lower than what I'd ship at work, higher than "vibe code it". The only consumer of this code is future-me, who will hate present-me if it's a mess.

---

## 1. Code style

### 1.1 TypeScript

- **Formatter:** Prettier (default config + `printWidth: 100`)
- **Linter:** ESLint with `next/core-web-vitals` and `@typescript-eslint/recommended`
- **Strict mode:** `tsconfig.json` has `"strict": true`, `"noUncheckedIndexedAccess": true`
- **No `any`** in production code; if I really need it, prefix the line with `// eslint-disable-next-line` and a comment explaining why
- **Absolute imports** via `@/*` alias; relative imports only within the same directory
- **Server components by default**; mark client components with `'use client'` deliberately

### 1.2 SQL & migrations

- Migrations via Supabase CLI (`supabase/migrations/`)
- One migration per logical change
- Migrations must be runnable forward; don't worry about rollback (this is single-user, I can backfill manually if needed)
- Add an index in the same migration as the column it indexes

### 1.3 Commits

- Conventional commits (`feat:`, `fix:`, `chore:`)
- Short, descriptive PR titles even on solo PRs (helps when scanning history later)
- Don't squash to lose the work-in-progress trail unless commits are truly noise

---

## 2. Testing

I'm not chasing 90% coverage on a personal project. Tests exist where they actually save me time.

### 2.1 What gets tested

| Layer | Test type | Why |
|---|---|---|
| **Sandbox / Judge0 integration** | Security tests with "malicious" C++ samples | If the sandbox is leaky I want to know before I find out the hard way |
| **Cost calculator** (`lib/anthropic/cost.ts`) | Unit tests with known input/output token counts | If I'm tracking spend, I want the numbers right |
| **Verdict logic** (`lib/judge0/verdict.ts`) | Unit tests with sample stdout vs expected | Diff logic is fiddly; bugs here are silent |
| **Auth middleware** | Integration test that confirms a non-owner email gets 403 | The single-user lock has to actually work |
| **Lesson generation cache hit/miss** | Integration test: hit endpoint twice, verify only one LLM call | The whole cost model depends on this |

### 2.2 What I'm NOT testing

- UI components — I'll see them when I use them
- Most API routes — I'll see them when I use them
- Hint tier escalation logic — too vibe-dependent, hard to test meaningfully, I'll eval by feel
- LLM outputs themselves — that's what reading the rendered lesson is for

### 2.3 Sandbox security suite (mandatory)

These programs run in CI against the actual Judge0 deployment (or a local docker-compose replica) and must all produce a *safe* verdict:

```cpp
// FORK BOMB — expect TLE or pids limit kill
int main(){ while(1) fork(); }

// NETWORK EGRESS — expect failure (no network)
#include <sys/socket.h>
// connect to 1.1.1.1:80, expect ENETUNREACH

// FILESYSTEM ESCAPE — expect permission denied
std::ofstream("/etc/passwd_pwn") << "x";

// MEMORY EXHAUSTION — expect MLE
std::vector<char> v; while(true) v.push_back(0);

// INFINITE LOOP — expect TLE at 5s
while(true) {}

// PROCESS ENUM — expect only own tree visible
system("ps auxf");
```

If any of these escape the sandbox or hang the host, that's a P0 issue. Fix before anything else.

---

## 3. Security

### 3.1 Code execution sandbox (mandatory controls)

Every deploy must pass these checks. I'll run them by hand on first deploy and after any infra change:

- [ ] Judge0 version pinned to a release patched against CVE-2024-29021 (1.13.1 or later)
- [ ] Container runtime is `runsc` (gVisor), verified with `docker inspect`
- [ ] Container is NOT `--privileged`
- [ ] `--security-opt=no-new-privileges` set
- [ ] `enable_network=false` in Judge0 config
- [ ] CPU limit ≤ 1 core, memory ≤ 256MB, pids ≤ 64
- [ ] Container runs as non-root (uid 1000)
- [ ] Judge0 API requires `X-Auth-Token` header; token stored in Vercel env vars
- [ ] Judge0 host only reachable from my Vercel deployment (IP allow-list or private network)

### 3.2 Single-user lock

The whole app is gated by a single allowed email. If this lock breaks, everyone on the internet can burn my Anthropic budget. So:

- [ ] `OWNER_EMAIL` env var configured in Vercel
- [ ] Middleware in `middleware.ts` rejects every authenticated request where `session.user.email !== OWNER_EMAIL`
- [ ] Postgres RLS policies double-enforce the same check at the DB layer
- [ ] No public signup form exists in the UI
- [ ] Supabase Auth is configured to *not* auto-create users on first sign-in (or, more practically, to allow auth but RLS rejects everything for non-owner emails)
- [ ] Manual test on every deploy: hit `/api/roadmap` while signed in as a non-owner test email, confirm 403

### 3.3 Secrets

- All secrets in Vercel env vars (encrypted at rest)
- `.env.example` committed with empty placeholders
- `.env.local` in `.gitignore` (never committed)
- Anthropic API key, Supabase service role key, Judge0 auth token — never in client-side code
- Use Supabase anon key on the client; service role key only in Route Handlers

### 3.4 Dependencies

- Dependabot enabled, weekly
- Patch any `high` or `critical` CVE with a fix available within a week
- Don't worry about `low`/`moderate` unless they affect something I actually use

---

## 4. Cost discipline

### 4.1 Hard ceiling alarms (manual)

I should look at `/stats/costs` once a week. If monthly LLM spend projects > $25, something is off. Likely culprits:

- Lesson regeneration loop running on every page load (caching broken)
- Prompt caching not actually applied
- Sonnet 4.6 being used where Haiku 4.5 would do
- Tutor conversations growing unbounded in context

### 4.2 Per-call sanity

Every LLM call goes through `lib/anthropic/client.ts`, which:

1. Logs input/output/cached tokens + model + call_type to `token_usage` table
2. Computes USD cost in microdollars (Sonnet 4.6: $3 / $15 per MTok; Haiku 4.5: $1 / $5; cached input: 10% of base)
3. Trips an in-process warning (`console.warn`) if any single call costs > $0.10

### 4.3 Cache invariants

These should be true at all times. If they break, the cost model breaks:

- A lesson with non-NULL `summary_md` never triggers an LLM call when its page is requested
- An exercise that exists in the DB never triggers regeneration on its lesson's page load
- A tutor conversation with N messages, when reloaded, performs zero LLM calls until I type something new
- Prompt caching `cache_control` is set on the system prompt + lesson context in every tutor call

---

## 5. Content quality (for the LLM-generated stuff)

The LLM is going to write 345 lesson summaries. Some will be off. I'll catch them as I read.

### 5.1 Inline regeneration

When I notice a bad summary, I have one button: **Regenerate** (calls `POST /api/lessons/[slug]/regenerate`). Costs roughly $0.02 per regeneration with Haiku 4.5. If a third regeneration is still bad, I edit it by hand.

### 5.2 Sanity check on first read

When I read a generated lesson for the first time, I'm doing the QA. Things to flag:

- [ ] Code example compiles? (I can paste it into the editor and hit Run.)
- [ ] Uses modern C++20 idioms, not C++03?
- [ ] Factual claims about C++ versions/features are correct? (Cross-check cppreference if unsure.)
- [ ] No "Let's dive in" / "It's important to note" / "I hope this helps" AI tells?
- [ ] Length feels right (250–400 words)?

If anything fails — regenerate or edit inline.

### 5.3 Exercise sanity check

For each exercise on first encounter:

- [ ] Starter code compiles (even if it doesn't pass tests)
- [ ] Reference solution exists internally (the LLM generated one) and passes all tests
- [ ] Tests are deterministic for fixed stdin
- [ ] At least one edge case is in the test set

---

## 6. Definition of done (per feature)

A feature is done when:

1. It works in my browser the way I expected when I started building it
2. The happy path is tested manually
3. If it's security-adjacent (sandbox, auth, cost), the relevant test from Section 2 still passes
4. If it persists data, the migration is committed
5. I've used it at least once for real, not just clicked through it

---

## 7. Operational hygiene

I'm not running an on-call rotation. I'm running a Tuesday night. So:

- **Logs:** Vercel function logs + Supabase log explorer. Read them when something looks off.
- **Backups:** Supabase daily PITR (built-in). I don't need to think about it.
- **Deploys:** Push to main → Vercel auto-deploys. Judge0 VM is rebuilt by hand via `fly deploy` (rare).
- **Incident response:** "I'll fix it later." No paging, no escalation. If the LLM is rate-limited or Judge0 is down, the cached content still works.
- **Cost monitoring:** Check `/stats/costs` once a week and Anthropic Console once a month.

---

## 8. Things I'll catch myself doing wrong (anti-patterns)

When I notice any of these creeping in, stop and fix:

- **Adding a feature because "future users might want it"** — there are no future users
- **Setting up monitoring/alerting for a single-user app** — `console.log` is the monitor
- **Generalizing code that's used in one place** — premature abstraction, just inline it
- **Writing tests for UI components** — I see them every day, I'll catch bugs visually
- **Building admin tooling** — I have psql access
- **Tweaking the prompts forever instead of using the app** — the goal is learning C++, not maximizing prompt quality
- **Adding a privacy policy** — there is no public visitor
- **Setting up Sentry / Datadog / DataDog / Grafana** — read logs when something breaks
- **"Just one more piece of infra"** — the answer is no
