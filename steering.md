# STEERING.md — cpproad (personal C++ learning tool)

> The north star. When future-me adds a feature that doesn't fit here, this is the document that says no.

---

## What this is

I'm building a C++ learning tool for myself. [learncpp.com](https://www.learncpp.com) has the best free C++ curriculum on the internet, but the experience is just reading. I want a guided walkthrough with exercises that compile in the browser and an LLM tutor I can interrogate when I'm stuck. The LLM teaches every lesson on the fly the first time I hit it, then the answer is stored in the database and served from cache on every revisit.

This is not a startup. There is one user (me), one machine in the cloud, and one budget that's mine personally. Decisions get made through that lens.

---

## User

Me. Raghav. CS at Rutgers. Strong in Python, ML, embedded systems. Weak in modern C++ (C++17/20/23 idioms, smart pointers, templates, move semantics, the type-deduction-and-references swamp). I'm building this because reading learncpp pages without exercises doesn't stick, and I want a tool I'll actually open at 11pm.

---

## What success looks like

Personal milestones, not product metrics.

- Chapters 0–6 done (basics through operators) by **Month 1**
- Through Chapter 11 (functions, scope, control flow, templates) by **Month 2**
- Through Chapter 17 (compound types, classes, vectors, arrays) by **Month 3**
- Through Chapter 25 (smart pointers, inheritance, polymorphism) by **Month 5**
- I can write a non-trivial modern C++ project end-to-end without LLM hand-holding by **Month 6**
- Honest target: 30 minutes a day, 5 days a week

**Anti-goals.** Things I will not measure:
- User count (it's me)
- Lesson catalog completeness (I'll skip chapters I don't care about)
- "Polish" of the UI for hypothetical others
- Public launch readiness
- Revenue

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

Reasoning: Supabase plus Vercel is the lowest-ops stack for a TypeScript-end-to-end project. I don't want to be deploying a separate FastAPI service for one user. Judge0 has to be its own VM because Vercel serverless can't run untrusted compiled binaries, and that's the only piece that doesn't fit the Vercel + Supabase footprint.

---

## The core caching pattern (the load-bearing decision)

When I visit a lesson for the first time, the LLM generates the explanation, exercises, and test cases. These are written to Supabase Postgres immediately. Every revisit serves the stored version. The LLM is called again only when I:

- Hit a lesson I haven't seen yet
- Ask the tutor a new question in the chat panel
- Explicitly request a regenerate ("teach this differently")

This means **my LLM bill is bounded by how much new material I cover, not how often I use the app.** Three hundred and forty-five lessons + N tutor turns + a few regenerates is my realistic ceiling. At Sonnet 4.6 pricing with prompt caching, my total spend to walk the entire curriculum sits under $15.

---

## Hard constraints

What I won't break even when I'm tempted.

### Sandboxed code execution

Even though it's my own buggy code, I'm not running it in the same process as the web app. Judge0 on a separate VM with strict resource limits. If a fork bomb in an exercise can crash the app, that's a bug.

### LLM cost ceiling

All-in spend ≤ **$30/month**. There's one user. There's no excuse to burn more. Means:

- Prompt caching on every Anthropic call (90% off cached input)
- Cache LLM responses in DB; never call the LLM twice for the same lesson/question
- Sonnet 4.6 for tutor turns where quality matters, Haiku 4.5 for lesson generation and routine work

### Boring infrastructure

This is a side project. If something takes me more than a weekend to ship, the design is wrong. Default to the dumb solution.

### Don't break it for me

If I open the app on a Tuesday night to learn polymorphism and the database is migrating or the LLM is rate-limited, that's a bad day. Reliability over cleverness.

---

## Curriculum source

The chapter and lesson ordering comes from learncpp.com's table of contents. I scraped it once into `curriculum_seed.json` (345 lessons across 34 chapters). Structure-only — I'm not copying their content. The LLM teaches each topic from its own knowledge based on the lesson title and where it sits in the curriculum.

This is fine legally (ordering and short titles aren't protectable) and ethically (I'm a single user using their map for my own learning). An optional "Further reading" link to the corresponding learncpp page sits at the bottom of each lesson — costs nothing and is a courtesy to Alex who wrote the original curriculum.

I don't intend to re-scrape regularly. If learncpp adds new chapters in 2027 and I notice, I'll re-run the seed script manually.

---

## Out of scope (for good)

Anything below this line is filed under "do not build":

- Multi-user. Auth exists only to lock the app to me. No signup flow visible to anyone else.
- Mobile apps. Mobile web responsive is enough; I'll mostly use this on a laptop anyway.
- Public marketing site. No landing page. No SEO. The root URL is the app.
- Compliance pages (privacy policy, ToS, GDPR data export). It's my own data. I know what I do with it.
- Monetization. Free for the one user.
- Social anything — comments, leaderboards, sharing, profile pages.
- Admin tooling. I am admin. I can SQL directly into Supabase if I need to fix something.
- Lesson "approval queue". Generated content goes live immediately. If a generated explanation is bad I'll regenerate or edit it inline.
- A pretty 404 page.
- Status page, alerting integrations, on-call rotation. If it's down I'll fix it the next time I open it.
- C++ language servers, real IntelliSense, in-browser debugger. Compile errors + print debugging is enough.
- Multi-file exercises. Single `main.cpp` per exercise.
- Other languages.

---

## How I'll make decisions

In this order:

1. **Will building this help me actually learn C++?** If no, drop it.
2. **Can I ship a working version this weekend?** If no, cut the scope in half and try again.
3. **Am I building this for a hypothetical future user?** If yes, stop. There is no future user.
4. **What's the dumbest version that works?** Build that.

---

## When I'll know it's working

When I open the app at 11pm because I want to learn something, not because I'm checking on it. When the tutor catches me misusing `std::move` and asks me what value category I think I'm holding. When I look at my old generated lesson summaries and they still make sense to me. When my chapter completion graph (the only graph in the app) shows steady forward motion.

That's it. No KPIs. No dashboards.

---

## Open questions

Things to decide as I build, not now:

- **Q1:** When a generated lesson summary is bad, do I edit it in place, regenerate from scratch, or keep both versions? Probably regenerate and overwrite — version history is over-engineering for one user.
- **Q2:** Do I want a "scratch" code editor that isn't tied to any exercise, for when I just want to try something? Maybe. Cheap to add later.
- **Q3:** Do I want my tutor conversations searchable across lessons? Probably, eventually. Supabase full-text search is one query away.
