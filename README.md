<p align="center">
  <img src="public/fulllogo-Photoroom.png" alt="cpproad" width="360">
</p>

<p align="center">
  Learn C++ by working through the <a href="https://www.learncpp.com/">learncpp.com</a> curriculum
  with an AI tutor, auto-graded exercises, and a sandboxed compiler — free, open, and open source.
</p>

---

## What is cpproad?

cpproad is a consumer-facing C++ learning platform. It takes the full learncpp.com
curriculum — **34 chapters, 345 lessons** — and turns it into an interactive course:
read a lesson, write code against it in-browser, run it in a sandbox, get stuck, ask
an AI tutor for a hint instead of the answer, and come back tomorrow for spaced-repetition
review of what you learned.

It's free to sign up and use. There's no paid tier, no gated content — the goal is a
good, honest way to learn C++ from first principles, not a funnel.

## How it teaches

- **Lessons** — each lesson gets an LLM-generated summary the first time anyone visits
  it, cached permanently so nobody pays that cost twice. Chapters and lessons follow the
  learncpp ordering; content is paraphrased into cpproad's own voice, not scraped verbatim.
- **Exercises** — every lesson pairs with coding exercises, graded by running your
  submission against real test cases in a sandboxed [Judge0](https://judge0.com/) instance.
- **AI tutor** — when you're stuck, the tutor is scoped to a 4-tier hint policy (nudge →
  concept hint → structural hint → worked example) so it teaches instead of just handing
  you the answer.
- **Daily review** — a spaced-repetition scheduler resurfaces concept checks you've
  already seen, so retention doesn't depend on you remembering to go back and reread.
- **GitHub sync** *(optional)* — connect your GitHub account and passed submissions get
  committed to your own public `cpproad-submissions` repo, so your practice shows up on
  your contribution graph.

## Why it's built this way

The one architectural rule that matters most: **a lesson, once generated, never calls
the LLM again.** Summaries, exercises, and concept checks are generated once and cached
in Postgres; every revisit — by any user — is a cache hit. This is what keeps the
platform's operating cost sane at open-signup scale, and it's a hard invariant across
the codebase, not just an optimization.

Code execution is fully sandboxed and isolated per submission — nothing you run touches
another user's session, the host filesystem, or the network.

## Contributing

cpproad is open to contributors, especially people who want to **teach**: improve a
lesson explanation, write better exercises, fix a wrong test case, or flag a spot where
the curriculum doesn't teach a concept well.

**Every contribution starts with an issue.** No unsolicited pull requests — open an
issue first (bug, content problem, or feature proposal), let it get discussed and
triaged, and then submit a PR that references it. This keeps duplicate work down and
means nobody spends time on a PR for something that was already rejected or is already
in progress.

- **Found a bug?** Open an issue with steps to reproduce.
- **Found a wrong or unclear lesson / exercise?** Open an issue tagged `content`,
  naming the chapter and lesson number. Lesson and exercise content lives under
  `scripts/regenerated/v2/<lesson>/` as reviewable `summary.md` / `exercises.json`
  files — not hidden behind a live LLM call — so it can be read, diffed, and corrected
  like any other file. Content changes are validated by `scripts/validate_v2.ts`
  before they can be merged.
- **Want to propose a new feature?** Open an issue describing the problem it solves
  first. Feature PRs without a prior issue will be asked to open one.

No installation or deployment walkthrough lives in this README on purpose — this
document is about what the project teaches and how it's organized, not about running
your own copy.

## License

MIT — see [LICENSE](LICENSE).
