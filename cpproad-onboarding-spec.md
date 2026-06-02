# cpproad — Onboarding Spec

Screen-by-screen flow with exact copy, branching logic, and routing. Built for a consumer-facing, self-paced, code-first product. The whole flow should take under 60 seconds and end with the learner inside a lesson, not on a dashboard.

---

## Design principles

1. **Value before signup.** Let visitors edit and run C++ in the sandbox before any account exists. The "aha" is *Save → Run → output*, and it should happen on the landing page.
2. **Three questions, max.** Only ask what changes the next screen. Everything else is deferred or inferred from behavior.
3. **Every answer pays off.** Each question visibly changes where they land or what the lesson says. No dead-end survey questions.
4. **One decision per screen.** Progress indicator, back navigation, skippable where noted.
5. **Branch on intent, not discovery.** Everyone here wants C++. The flow places them correctly — it doesn't ask "what do you want to learn."

---

## Data model

Persist to `localStorage` during the pre-account flow, then sync to the user record on account creation.

```ts
type Background = 'new' | 'other_lang' | 'some_cpp';
type Motivation = 'interviews' | 'school' | 'gamedev' | 'systems' | 'competitive' | 'curious';

interface OnboardingState {
  ranSandbox: boolean;          // did they hit Run pre-signup
  background: Background | null;
  motivation: Motivation | null;
  startModule: ModuleId | null; // chosen or derived
  placementTaken: boolean;
  placementScore: number | null;
  weeklyGoal: number | null;    // lessons/week, optional
  completedFirstLesson: boolean;// gate for account prompt
}
```

`ModuleId` maps to the existing path:

```ts
type ModuleId =
  // Basics
  | 'variables' | 'control-flow' | 'functions' | 'arrays-strings' | 'io-streams' | 'operators'
  // Memory & OOP
  | 'pointers' | 'references' | 'classes' | 'raii'
  // STL & Templates
  | 'vectors-maps' | 'algorithms' | 'templates'
  // Advanced
  | 'move-semantics' | 'smart-pointers' | 'concurrency';
```

---

## Flow overview

```
Landing (sandbox, no account)
        │  hit Run  →  ranSandbox = true
        ▼
[S1] Background ───────────────┐
        ▼                      │
[S2] Motivation                │
        ▼                      │
[S3] Starting point  ◄─ branches on background
        ▼
[S4] Weekly goal (skippable)
        ▼
[S5] "You're set" payoff  →  First lesson (no account yet)
        ▼
   complete first lesson
        ▼
[Account] "Save your progress"  →  email/password or OAuth
```

---

## Screen-by-screen

### Landing — try it first (pre-signup)

No new screen to build; instrument what's already there. The `main.cpp` block on the landing page becomes editable with a **Run** button.

- On first **Run**: set `ranSandbox = true`, show compiled output inline.
- After output renders, surface a soft CTA below the editor using shadcn **`Button`** `variant="default"`.

> **Copy (post-run CTA):**
> Nice — that compiled and ran. Want a path from here to templates?
> **[ Start learning ]** ← shadcn `Button`

Clicking **Start learning** enters the flow at S1. (Existing "Start learning" / register links also enter at S1.)

---

### S1 — Background

The most important question. Sets the starting module and how verbose lessons + the AI tutor should be.

> **Heading:** First, where are you starting from?
> **Subtext:** This sets your starting point. You can change it anytime.

| Option label | Value | Stores |
|---|---|---|
| New to programming | `new` | `background='new'` |
| I know another language (Python, JS, Java…) | `other_lang` | `background='other_lang'` |
| I've written some C or C++ | `some_cpp` | `background='some_cpp'` |

Single-select via shadcn **`RadioGroup`** + **`RadioGroupItem`**, advance on tap. Progress: `1 / 3` — use shadcn **`Progress`** component (`value={33}`).

---

### S2 — Motivation

Does **not** change the starting module. Flavors lesson examples, framing, and re-engagement copy.

> **Heading:** What are you learning C++ for?
> **Subtext:** We'll lean your examples in that direction.

| Option label | Value |
|---|---|
| Coding interviews / jobs | `interviews` |
| School or coursework | `school` |
| Game development | `gamedev` |
| Systems / embedded / robotics | `systems` |
| Competitive programming | `competitive` |
| Just curious | `curious` |

Single-select via shadcn **`RadioGroup`**, advance on tap. Progress: `2 / 3` (`Progress value={66}`).

---

### S3 — Starting point (branches on `background`)

#### Branch A — `background === 'new'`
No placement, no choice. Confirm and route to the very start.

> **Heading:** We'll start at the beginning.
> **Subtext:** First program, then variables, then we build up. No setup, no prior knowledge assumed.
> **[ Let's go ]**

Sets `startModule = 'variables'`. Progress: `3 / 3`.

#### Branch B — `background === 'other_lang'`
They know how to program; they don't know C++. Offer two routes.

> **Heading:** You already code. Want the C++-specific track?
> **Subtext:** Skip "what's a loop." Start where C++ actually differs — types, compilation, and memory.

| Option label | Sets |
|---|---|
| Yes, skip to what's different | `startModule='variables'`, flagged `fastTrack=true` (compressed Basics that assume programming literacy) |
| No, walk me through everything | `startModule='variables'`, `fastTrack=false` |

Progress: `3 / 3`.

> Implementation note: `fastTrack` is a lesson-rendering flag, not a different module. Fast-track Basics collapse the conceptual intro ("a variable stores a value") and lead with C++ specifics (static typing, `int` vs `auto`, compilation model, `&` references). Same lesson IDs, lighter prose.

#### Branch C — `background === 'some_cpp'`
Let them self-place, with an optional quick check.

> **Heading:** Where do you want to jump in?
> **Subtext:** Not sure? Take a 5-question check and we'll place you.

| Option label | Action |
|---|---|
| Memory & pointers | `startModule='pointers'` |
| Classes & RAII | `startModule='classes'` |
| STL & templates | `startModule='vectors-maps'` |
| Place me with a quick check | → Placement (below) |
| Actually, start me from the basics | `startModule='variables'` |

Progress: `3 / 3` (placement adds an interstitial, not a counted step).

---

### S3.1 — Placement check (only from Branch C → "quick check")

5 multiple-choice questions, one screen each, no time pressure. Score 0–5. Pure routing; never shown as a grade.

> **Intro copy:** Five quick ones. No score, no pressure — just so we don't start you somewhere boring.

Suggested items (one correct each):

1. **Pointers.** Given `int x = 5; int* p = &x; *p = 10;` — what is `x`? → tests deref basics.
2. **References.** What's the difference between `int& r = x;` and `int* p = &x;`? → tests references vs pointers.
3. **RAII.** When does a stack-allocated object's destructor run? → tests object lifetime.
4. **STL.** Which container gives O(1) average lookup by key? → `std::unordered_map`.
5. **Templates.** What does `template<typename T>` let you write? → tests generics intent.

**Scoring → route:**

```ts
function placeFromScore(score: number): ModuleId {
  if (score <= 1) return 'pointers';      // shaky on memory → Memory & OOP
  if (score <= 3) return 'vectors-maps';  // solid basics → STL & Templates
  return 'templates';                     // strong → deep STL / templates
}
```

Set `placementTaken = true`, `placementScore = score`, `startModule = placeFromScore(score)`.

> **Result copy:** Got it — starting you at **{moduleTitle}**. Too easy or too hard? Jump anywhere from the path on the left.

---

### S4 — Weekly goal (skippable)

A soft commitment. Skippable in one tap — many self-taught C++ learners are intrinsically motivated and bounce off gamification.

> **Heading:** Want a weekly target?
> **Subtext:** Optional. It's a nudge, not a streak you'll lose sleep over.

| Option | Sets `weeklyGoal` |
|---|---|
| Casual — 1 lesson/week | 1 |
| Steady — 3 lessons/week | 3 |
| Serious — 5+ lessons/week | 5 |
| No goal for now | `null` |

A visible **Skip** (shadcn `Button variant="ghost"`) also sets `null`. Use shadcn **`ToggleGroup`** `type="single"` for the goal options (renders as a row of selectable items). Progress: not counted (post-questionnaire).

---

### S5 — Payoff + first lesson

Confirm and route straight into `startModule`. Copy must reference their actual answers (this is the payoff that justifies the questions).

> **Heading:** You're set, {firstName or "let's go"}.
> **Body (templated):**
> Starting you at **{startModuleTitle}**. {motivationLine}
> Stuck on anything? Hit **Ask the tutor** in the corner — it can see your code.
> **[ Open first lesson ]**

`motivationLine` examples (pick by `motivation`):

- `interviews` → "Examples will lean toward the patterns that show up in interviews."
- `gamedev` → "Examples will lean toward the kind of code games actually run."
- `systems` → "Examples will lean toward low-level, close-to-the-metal code."
- `competitive` → "Examples will lean toward fast, tight, contest-style code."
- `school` → "Examples will track what most courses cover, in order."
- `curious` → "We'll keep it concrete — real code, real output, every step."

Clicking **Open first lesson** (shadcn `Button variant="default"`, full width) loads the lesson at `startModule`. **No account required yet.**

---

### Account creation (deferred)

Trigger **after** `completedFirstLesson === true`, not before. Framed as saving a win they already earned.

> **Heading:** Save your progress?
> **Subtext:** Create a free account to keep your place, your path, and your code.
> **[ Continue with Google ]** ← shadcn `Button variant="outline"` with Google icon
> **[ Sign up with email ]** ← shadcn `Button variant="default"`
> Small print: Already have an account? **[ Sign in ]** ← shadcn `Button variant="link"`

Render this in a shadcn **`Card`** with `CardHeader` + `CardContent` + `CardFooter`. Use shadcn **`Input`** + **`Label`** for the email field. Reference shadcn block `login-05` (email-only login) for the magic-link form layout.

On account creation, flush `OnboardingState` from `localStorage` to the user record.

> Implementation note: if a learner closes the tab before this, the `localStorage` state lets you restore their path on return and re-trigger the account prompt at the next lesson boundary.

---

## Branching logic (consolidated)

```ts
function deriveStartModule(s: OnboardingState): ModuleId {
  switch (s.background) {
    case 'new':
      return 'variables';
    case 'other_lang':
      return 'variables'; // fastTrack flag handles depth, not module
    case 'some_cpp':
      if (s.placementTaken && s.placementScore != null)
        return placeFromScore(s.placementScore);
      return s.startModule ?? 'pointers'; // self-selected, default to pointers
    default:
      return 'variables';
  }
}
```

Rendering flags:

```ts
const fastTrack = state.background === 'other_lang' && userChoseSkip;
const tutorVerbosity = state.background === 'new' ? 'high' : 'normal';
const exampleFlavor = state.motivation; // passed to lesson + tutor prompt
```

---

## Routing table

| Background | Path taken | Default start module |
|---|---|---|
| `new` | direct | `variables` (full prose) |
| `other_lang` + skip | direct | `variables` (fast-track) |
| `other_lang` + walk-through | direct | `variables` (full prose) |
| `some_cpp` + self-select | choice | chosen module |
| `some_cpp` + placement ≤1 | placement | `pointers` |
| `some_cpp` + placement 2–3 | placement | `vectors-maps` |
| `some_cpp` + placement 4–5 | placement | `templates` |

---

## AI tutor introduction

The tutor is the differentiator — introduce it during the first lesson, not in a settings menu.

- On the **first exercise** of `startModule`, auto-show a one-time coachmark on the tutor button: *"Stuck? Ask me — I can see your code."* Dismiss on first use or after 8s.
- Feed `motivation` and `background` into the tutor's system prompt so its explanations match the learner (e.g. terse for `some_cpp`, analogy-rich for `new`).

---

## What we defer or skip

| Item | When |
|---|---|
| Email / notification prefs | After first lesson, in settings |
| Display name / avatar | Account creation, optional |
| Theme / editor settings | Never asked; sensible default, change in settings |
| Demographics | Never |
| Streak / daily reminders | Opt-in only, surfaced after 2–3 lessons completed |

Track behavior instead of asking: which lessons get abandoned, where the tutor gets invoked, time-to-first-Run. Richer than a survey, zero friction.

---

## Analytics events

```
landing_run_clicked        { firstRun: bool }
onboarding_started
onboarding_q_answered      { step: 'background'|'motivation'|'start', value }
placement_started
placement_completed        { score }
goal_set                   { weeklyGoal }
first_lesson_opened        { startModule }
first_lesson_completed     { startModule }
account_created            { method }
onboarding_abandoned       { lastStep }   // fire on unload mid-flow
```

Activation metric to watch: **% of `landing_run_clicked` → `first_lesson_completed`**, and time between them. That's your time-to-first-value.

---

## Next.js / React implementation notes

- **Routing:** one route `/onboarding` with internal step state (`useReducer` over `OnboardingState`), or nested routes `/onboarding/[step]` if you want back/forward + shareable URLs. The reducer approach is simpler for a 3–5 screen flow.
- **No account during flow:** gate the lesson view to allow an anonymous session backed by `localStorage`; only require auth at the account screen.
- **Persistence:** write `OnboardingState` to `localStorage` on every step so a refresh resumes. On `account_created`, POST the state to your API and clear local.
- **Progress indicator:** shadcn **`Progress`** component with `value` at `33 · 66 · 100` for the three questions; placement and goal screens render outside the counter.
- **Back navigation:** keep answered values so returning to a step shows the prior selection (shadcn `Button variant="ghost"` with back arrow). Mirror the rest of the app's nav, per Codecademy's pattern.
- **A11y / mobile:** single-column, tap-to-advance, large hit targets. All interactive elements use shadcn primitives (built-in focus rings, keyboard nav, ARIA). The editor likely wants desktop, so if a learner lands the flow on mobile, let them finish the questionnaire but suggest desktop for the sandbox.
- **shadcn components used in this flow:** `Button`, `RadioGroup`, `Card`, `Progress`, `Input`, `Label`, `ToggleGroup`, `Separator`.
