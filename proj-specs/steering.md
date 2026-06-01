# STEERING.md — cpproad (consumer C++ learning platform)

> The north star. When we add a feature that doesn't fit here, this is the document that says no.

---

## What this is

A consumer-facing C++ learning platform. [learncpp.com](https://www.learncpp.com) has the best free C++ curriculum on the internet, but the experience is just reading. cpproad provides a guided walkthrough with exercises that compile in the browser and an LLM tutor users can interrogate when stuck. The LLM teaches every lesson on the fly the first time any user visits it, then the answer is stored in the database and served from cache on every revisit.

This is a product for real users — learners who want a hands-on, code-first C++ curriculum. Decisions get made through the lens of user value and sustainable cost.

---

## Users

Anyone learning C++. The primary audience is CS students and developers who are strong in other languages but weak in modern C++ (C++17/20/23 idioms, smart pointers, templates, move semantics, the type-deduction-and-references swamp). They want a tool they'll actually open at 11pm because reading learncpp pages without exercises doesn't stick.

---

## What success looks like

Product metrics that matter:

- Users can complete Chapters 0–6 (basics through operators) within their first month
- Active learners progress through at least one chapter per week
- Users return to the platform multiple times per week
- The tutor helps users get unstuck without giving away answers
- LLM costs stay sustainable as user count grows (caching is load-bearing)

**What we measure:**
- Active users and retention
- Lessons completed per user
- Tutor usage and satisfaction
- Cost per active user (must stay low thanks to caching)

---

## Stack (decided)

| Layer | Pick |
|---|---|
| Frontend + API | Next.js (App Router) on Vercel |
| Auth, DB, storage, realtime | Supabase (one service does the lot) |
| LLM | Anthropic Claude — Sonnet 4.6 for tutor, Haiku 4.5 for cheap stuff |
| Editor | Monaco in the browser |
| Code execution | Self-hosted Judge0 on a tiny Fly.io or Hetzner VM, gVisor on top |
| LLM response cache | Supabase Postgres, keyed by request shape |

Reasoning: Supabase plus Vercel is the lowest-ops stack for a TypeScript-end-to-end project. No need for a separate FastAPI service. Judge0 has to be its own VM because Vercel serverless can't run untrusted compiled binaries, and that's the only piece that doesn't fit the Vercel + Supabase footprint.

---

## The core caching pattern (the load-bearing decision)

When any user visits a lesson for the first time (globally), the LLM generates the explanation, exercises, and test cases. These are written to Supabase Postgres immediately. Every subsequent visit by any user serves the stored version. The LLM is called again only when:

- A lesson has never been visited before (global cache miss)
- A user asks the tutor a new question in the chat panel
- An admin explicitly requests a regenerate ("teach this differently")

This means **LLM costs are bounded by the curriculum size, not by user count.** Once all 345 lessons are generated, the only ongoing LLM cost is tutor conversations. Lesson content is shared across all users; tutor conversations are per-user. At Sonnet 4.6 pricing with prompt caching, seeding the entire curriculum costs under $15 one-time.

---

## Hard constraints

What I won't break even when I'm tempted.

### Sandboxed code execution

User-submitted code must never run in the same process as the web app. Judge0 on a separate VM with strict resource limits. If a fork bomb in an exercise can crash the app, that's a bug.

### LLM cost ceiling

Keep per-user LLM costs sustainable. Lesson content is generated once and shared; only tutor conversations scale with user count. Means:

- Prompt caching on every Anthropic call (90% off cached input)
- Cache LLM responses in DB; never call the LLM twice for the same lesson/question
- Sonnet 4.6 for tutor turns where quality matters, Haiku 4.5 for lesson generation and routine work

### Boring infrastructure

This is a side project. If something takes me more than a weekend to ship, the design is wrong. Default to the dumb solution.

### Don't break it for users

If a user opens the app at 11pm to learn polymorphism and the database is migrating or the LLM is rate-limited, that's a bad day. Reliability over cleverness.

---

## Curriculum source

The chapter and lesson ordering comes from learncpp.com's table of contents. I scraped it once into `curriculum_seed.json` (345 lessons across 34 chapters). Structure-only — I'm not copying their content. The LLM teaches each topic from its own knowledge based on the lesson title and where it sits in the curriculum.

This is fine legally (ordering and short titles aren't protectable) and ethically (we're using their map as a curriculum structure, not copying content). An optional "Further reading" link to the corresponding learncpp page sits at the bottom of each lesson — costs nothing and is a courtesy to Alex who wrote the original curriculum.

No automated re-scraping. If learncpp adds new chapters, re-run the seed script manually.

---

## Out of scope (for now)

Anything below this line is filed under "do not build yet":

- Mobile apps. Mobile web responsive is enough; most users will use this on a laptop.
- Social anything — comments, leaderboards, sharing, profile pages.
- Lesson "approval queue". Generated content goes live immediately. If a generated explanation is bad, regenerate or edit it inline.
- Status page, alerting integrations, on-call rotation.
- C++ language servers, real IntelliSense, in-browser debugger. Compile errors + print debugging is enough.
- Multi-file exercises. Single `main.cpp` per exercise.
- Other languages.

---

## How we make decisions

In this order:

1. **Does this help users learn C++ better?** If no, drop it.
2. **Can we ship a working version this weekend?** If no, cut the scope in half and try again.
3. **Does this scale with users without blowing up costs?** The caching model must hold.
4. **What's the simplest version that works?** Build that.

---

## When we'll know it's working

When users open the app at 11pm because they want to learn something, not because they feel obligated. When the tutor catches a user misusing `std::move` and asks what value category they think they're holding. When users return to their generated lesson summaries and they still make sense. When chapter completion graphs show steady forward motion across the user base.

---

## Open questions

Things to decide as we build, not now:

- **Q1:** When a generated lesson summary is bad, do we edit it in place, regenerate from scratch, or keep both versions? Probably regenerate and overwrite — version history adds complexity.
- **Q2:** Do we want a "scratch" code editor that isn't tied to any exercise, for when users just want to try something? Maybe. Cheap to add later.
- **Q3:** Do we want tutor conversations searchable across lessons? Probably, eventually. Supabase full-text search is one query away.
- **Q4:** Pricing model — free tier with tutor limits? Pay per tutor turn? Flat subscription? Decide based on early usage patterns.
