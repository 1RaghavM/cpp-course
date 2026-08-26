<p align="center">
  <img src="public/fulllogo-Photoroom.png" alt="cpproad" width="360">
</p>

<p align="center">
  Learn C++ through the <a href="https://www.learncpp.com/">learncpp.com</a> curriculum —
  345 lessons, auto-graded exercises, a sandboxed compiler, and an AI tutor that runs on your own API key.
</p>

---

## What it is

cpproad turns the learncpp.com curriculum (34 chapters, 345 lessons) into an interactive
course: read the lesson, write code in the browser, run it against real test cases, ask the
tutor for a hint when you're stuck, and get the concept back tomorrow in review.

Free, open signup, no paid tier, no gated content.

## Stack

| Layer | What runs it |
|---|---|
| App + API | Next.js App Router, TypeScript strict mode, Vercel |
| Data + auth | Supabase Postgres, magic-link auth, RLS on every table |
| Code execution | Judge0 on the RapidAPI shared host |
| Tutor | Gemini 2.5 Flash, streaming, user-supplied key |

## Content is data, not a runtime LLM call

Lesson summaries, exercises, and concept checks are authored offline and stored as plain
files under `scripts/regenerated/v2/<lesson>/` — `summary.md` and `exercises.json`. They're
validated by `scripts/validate_v2.ts` and pushed into Postgres by `scripts/push_v2.ts`.

Serving a lesson is a database read. Nothing in the request path calls a model, so content
is diffable in git, reviewable in a PR, and costs nothing per pageview. Content is
paraphrased into cpproad's own voice, not scraped verbatim.

## Tutor

Bring your own Gemini key. It's AES-256-GCM encrypted before it reaches the database and
decrypted per request — cpproad never proxies a shared key, so tutor usage bills to the
person using it. Without a key, `/api/chat` returns 403 rather than falling back to
anything.

Hints escalate across four tiers: nudge → concept → structure → worked example. The tier
comes from conversation state, so the tutor can't open with the answer.

## Exercises and grading

Submissions compile and run in a sandboxed Judge0 instance, then get diffed against
per-exercise test cases. Fork bombs, network egress, filesystem writes, OOM, infinite loops,
and process enumeration were verified to fail closed as of 2026-06-11.

Production runs against RapidAPI's shared host, which means patch level, isolation, and rate
limits are outside our control. A self-hosted gVisor setup is staged in `infra/judge0/` and
is **not** production-ready — the gVisor runtime is commented out and workers run
privileged. Re-harden before deploying it.

## Review scheduling

Every concept check a user answers writes both an attempt row and its scheduler state
(`interval_index`, `next_due`) in one RPC. `GET /api/review/due` returns up to 20 due cards
and nothing else touches the scheduler — all writes funnel through `applyAttempt` in
`lib/content/review.ts` so the two tables can't drift apart.

## GitHub sync (optional)

Connect a GitHub account and passed submissions get committed to your own public
`cpproad-submissions` repo via the Contents API, so practice shows up on your contribution
graph. Scope requested is `public_repo`; the token is encrypted at rest. Inert until an
operator registers an OAuth app.

## Contributing

Contributions are open, especially from people who want to **teach**: sharpen a lesson
explanation, write a better exercise, fix a wrong test case, or flag where the curriculum
glosses over a concept.

**Every contribution starts with an issue.** No unsolicited pull requests — open an issue,
let it get triaged, then submit a PR referencing it. This keeps duplicate work down and
means nobody burns a weekend on something already rejected or already in flight.

- **Bug** — open an issue with steps to reproduce.
- **Wrong or unclear content** — open an issue tagged `content` naming the chapter and
  lesson number. The source files are under `scripts/regenerated/v2/`; fix them like any
  other file and `scripts/validate_v2.ts` will gate the merge.
- **Feature** — describe the problem before the solution. Feature PRs without a prior issue
  get asked to open one.

This README documents what the project teaches and how it's put together, not how to run
your own copy. Open an issue if you need a local setup guide.

## License

MIT — see [LICENSE](LICENSE).
