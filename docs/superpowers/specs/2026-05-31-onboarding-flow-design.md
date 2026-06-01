# Onboarding Flow — Design Spec

> Screen-by-screen onboarding that places a new learner in the right lesson in under 60 seconds. Built on top of the existing cpproad codebase (Next.js 14, Supabase, Tailwind 3, dark design system).

## Decisions (from brainstorming)

| Decision | Choice | Rationale |
|---|---|---|
| Landing page sandbox | Static — no Run button | Keeps marketing page simple; no Judge0 on public page |
| Account creation timing | Before first lesson (after questionnaire) | Avoids anonymous session complexity; no unauthenticated lesson routes |
| Flow order | Questionnaire → Signup → Payoff → Lesson | Payoff screen can use account name; feels like a welcome moment |
| Weekly goal (S4) | Included, skippable | Preserves the option for future pacing features |
| Placement questions | Hardcoded TypeScript file | Simple, version-controlled, no DB round-trip for pre-auth flow |
| Onboarding storage | New `onboarding` table | Clean separation, easy to query for analytics |
| Routing | Single `/onboarding` route + `useReducer` | Simpler than nested routes for a 4-screen flow |
| Analytics | Deferred — `console.log` stubs for now | Keeps scope tight; event shape is defined, wiring comes later |

---

## Route structure & file layout

```
app/
  (onboarding)/
    layout.tsx              # Minimal dark layout — no sidebar, no app shell.
                            # Imports GeistSans/Mono, applies homepage CSS vars.
                            # Centered column on --color-bg.
    onboarding/
      page.tsx              # 'use client' — single-page flow.
                            # useReducer over OnboardingState, renders current step.

lib/
  onboarding/
    types.ts                # OnboardingState, Background, Motivation, ModuleId, Action types
    reducer.ts              # Pure reducer: step transitions, branching logic, deriveStartModule()
    placement-questions.ts  # 5 hardcoded MC questions with correct answers + placeFromScore()
    storage.ts              # Read/write OnboardingState to localStorage
    constants.ts            # Module titles map, motivationLine map, MODULE_FIRST_LESSON map

components/
  onboarding/
    StepBackground.tsx      # S1 — 3 option cards
    StepMotivation.tsx      # S2 — 6 option cards
    StepStartingPoint.tsx   # S3 — branches on background (A/B/C)
    StepWeeklyGoal.tsx      # S4 — 4 options + skip
    StepPayoff.tsx          # S5 — personalized "You're set" screen
    PlacementQuiz.tsx       # S3.1 — 5 questions, one at a time
    ProgressBar.tsx         # "1 / 3" indicator for S1–S3
    OptionCard.tsx          # Reusable single-select card
```

The `(onboarding)` route group has its own layout — not `(marketing)` (has nav/footer) and not `(app)` (requires auth). It shares the same dark design tokens from the homepage CSS.

`page.tsx` is the only `'use client'` file. Step components are plain client components receiving `state` + `dispatch`.

---

## State management

### Types

```ts
type Background = 'new' | 'other_lang' | 'some_cpp';
type Motivation = 'interviews' | 'school' | 'gamedev' | 'systems' | 'competitive' | 'curious';

type ModuleId =
  | 'variables' | 'control-flow' | 'functions' | 'arrays-strings' | 'io-streams' | 'operators'
  | 'pointers' | 'references' | 'classes' | 'raii'
  | 'vectors-maps' | 'algorithms' | 'templates'
  | 'move-semantics' | 'smart-pointers' | 'concurrency';

type Step =
  | 'background' | 'motivation' | 'starting-point'
  | 'placement' | 'weekly-goal' | 'payoff';

interface OnboardingState {
  step: Step;
  background: Background | null;
  motivation: Motivation | null;
  startModule: ModuleId | null;
  fastTrack: boolean;
  placementTaken: boolean;
  placementScore: number | null;
  weeklyGoal: number | null;
}
```

### Reducer actions

| Action | Effect | Next step |
|---|---|---|
| `SET_BACKGROUND(value)` | Stores background | `motivation` |
| `SET_MOTIVATION(value)` | Stores motivation | `starting-point` |
| `SET_START_MODULE(module, fastTrack?)` | Stores module + flag | `weekly-goal` |
| `START_PLACEMENT` | — | `placement` |
| `COMPLETE_PLACEMENT(score)` | Stores score, derives module | `weekly-goal` |
| `SET_WEEKLY_GOAL(value | null)` | Stores goal | Redirects to `/register` |
| `GO_BACK` | Steps backward | Previous step (preserves selections). Back from `weekly-goal` → `starting-point` (skips placement even if taken). Back from `placement` → `starting-point`. Back from `starting-point` → `motivation`. Back from `motivation` → `background`. |

### localStorage persistence

`storage.ts` exports `saveOnboardingState(state)` and `loadOnboardingState(): OnboardingState | null`. Called in a `useEffect` after every dispatch. On mount, if saved state exists, the reducer initializes from it (resume on refresh).

### Branching logic

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
      return s.startModule ?? 'pointers';
    default:
      return 'variables';
  }
}

function placeFromScore(score: number): ModuleId {
  if (score <= 1) return 'pointers';
  if (score <= 3) return 'vectors-maps';
  return 'templates';
}
```

### Rendering flags (consumed by lesson generation + tutor)

```ts
const fastTrack = state.background === 'other_lang' && userChoseSkip;
const tutorVerbosity = state.background === 'new' ? 'high' : 'normal';
const exampleFlavor = state.motivation;
```

---

## Screen components

All screens share the same visual pattern: centered column (max-width ~520px), heading + subtext, option cards below. Dark surface aesthetic matching the homepage design system.

### OptionCard (shared primitive)

- `--color-surface` background, `--hairline` border, `--radius-md`, 24px padding
- Hover: border → `--color-border-strong`, bg → `--color-surface-2`, 150ms ease
- Selected state: `--color-accent` border, subtle accent glow
- Tap/click dispatches immediately and advances (no separate "Next" button)
- Keyboard: focusable, Enter/Space to select, arrow keys between options

### S1 — Background (progress: 1/3)

> **Heading:** First, where are you starting from?
> **Subtext:** This sets your starting point. You can change it anytime.

3 option cards, stacked vertically:
- "New to programming" → `new`
- "I know another language (Python, JS, Java...)" → `other_lang`
- "I've written some C or C++" → `some_cpp`

### S2 — Motivation (progress: 2/3)

> **Heading:** What are you learning C++ for?
> **Subtext:** We'll lean your examples in that direction.

6 option cards in 2-column grid (desktop), single column (mobile):
- Coding interviews / jobs → `interviews`
- School or coursework → `school`
- Game development → `gamedev`
- Systems / embedded / robotics → `systems`
- Competitive programming → `competitive`
- Just curious → `curious`

### S3 — Starting Point (progress: 3/3)

Branches on `background`:

**Branch A (`new`):** Confirmation screen.
> **Heading:** We'll start at the beginning.
> **Subtext:** First program, then variables, then we build up. No setup, no prior knowledge assumed.
> **[ Let's go ]** (primary button)

Sets `startModule = 'variables'`.

**Branch B (`other_lang`):** Two option cards.
> **Heading:** You already code. Want the C++-specific track?
> **Subtext:** Skip "what's a loop." Start where C++ actually differs — types, compilation, and memory.

- "Yes, skip to what's different" → `startModule='variables'`, `fastTrack=true`
- "No, walk me through everything" → `startModule='variables'`, `fastTrack=false`

**Branch C (`some_cpp`):** Five option cards.
> **Heading:** Where do you want to jump in?
> **Subtext:** Not sure? Take a 5-question check and we'll place you.

- Memory & pointers → `startModule='pointers'`
- Classes & RAII → `startModule='classes'`
- STL & templates → `startModule='vectors-maps'`
- Place me with a quick check → dispatches `START_PLACEMENT`
- Actually, start me from the basics → `startModule='variables'`

### S3.1 — Placement Quiz (no progress counter)

> **Intro:** Five quick ones. No score, no pressure — just so we don't start you somewhere boring.

5 questions, one screen each. Each shows the code/concept in a monospace code card with 4 answer options as compact cards. Subtle `1/5` ... `5/5` counter in `--color-fg-subtle`.

Questions:
1. Pointer dereference (`int x = 5; int* p = &x; *p = 10;` — what is `x`?)
2. References vs pointers
3. RAII / destructor lifetime
4. STL container lookup complexity (`std::unordered_map`)
5. Template intent (`template<typename T>`)

After question 5: `placeFromScore()` runs, dispatches `COMPLETE_PLACEMENT`.

Brief result: "Got it — starting you at **{moduleTitle}**." + continue button.

### S4 — Weekly Goal (no progress counter)

> **Heading:** Want a weekly target?
> **Subtext:** Optional. It's a nudge, not a streak you'll lose sleep over.

4 option cards:
- Casual — 1 lesson/week → `1`
- Steady — 3 lessons/week → `3`
- Serious — 5+ lessons/week → `5`
- No goal for now → `null`

Visible **Skip** link below cards → dispatches `SET_WEEKLY_GOAL(null)`.

After selection: redirects to `/register`.

### S5 — Payoff (authenticated, post-signup)

> **Heading:** You're set, {firstName or "let's go"}.

The register form does not currently collect a name. Use `user.user_metadata.full_name` if available (e.g., from OAuth), otherwise fall back to the generic "let's go".
> **Body:** Starting you at **{startModuleTitle}**. {motivationLine}
> Stuck on anything? Hit **Ask the tutor** in the corner — it can see your code.
> **[ Open first lesson ]**

`motivationLine` by motivation:
- `interviews` → "Examples will lean toward the patterns that show up in interviews."
- `gamedev` → "Examples will lean toward the kind of code games actually run."
- `systems` → "Examples will lean toward low-level, close-to-the-metal code."
- `competitive` → "Examples will lean toward fast, tight, contest-style code."
- `school` → "Examples will track what most courses cover, in order."
- `curious` → "We'll keep it concrete — real code, real output, every step."

"Open first lesson" routes to `/lessons/{slug}` using `MODULE_FIRST_LESSON` map.

### Transitions

Subtle crossfade between steps (opacity 0→1, 8px rise, ~200ms) using `motion` library. Disabled under `prefers-reduced-motion`.

### Back navigation

Back arrow in top-left on S2, S3, S4. Dispatches `GO_BACK`. Previous selections preserved.

---

## Database schema

New migration `006_onboarding.sql`:

```sql
CREATE TABLE onboarding (
    user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    background      TEXT NOT NULL CHECK (background IN ('new', 'other_lang', 'some_cpp')),
    motivation      TEXT NOT NULL CHECK (motivation IN (
                        'interviews', 'school', 'gamedev',
                        'systems', 'competitive', 'curious')),
    start_module    TEXT NOT NULL,
    fast_track      BOOLEAN NOT NULL DEFAULT false,
    placement_taken BOOLEAN NOT NULL DEFAULT false,
    placement_score SMALLINT CHECK (placement_score BETWEEN 0 AND 5),
    weekly_goal     SMALLINT CHECK (weekly_goal IN (1, 3, 5)),
    created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY onboarding_owner ON onboarding
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

Single row per user, one-time write. Upsert if they redo onboarding.

---

## API route

`app/api/onboarding/route.ts`:

**POST** — Accepts `OnboardingPayload` from localStorage after signup. Validates shape, upserts into `onboarding` table. Requires auth. Returns `{ ok: true, startModule }`.

```ts
interface OnboardingPayload {
  background: Background;
  motivation: Motivation;
  startModule: ModuleId;
  fastTrack: boolean;
  placementTaken: boolean;
  placementScore: number | null;
  weeklyGoal: number | null;
}
```

**GET** — Returns the user's onboarding row. Used by the payoff screen and by the tutor/lesson system.

---

## Post-signup handoff

1. Questionnaire at `/onboarding` (no auth) → localStorage written → redirect to `/register`
2. User signs up → auth callback → redirects to app
3. App entry (`AppShell` `useEffect`) detects onboarding data in localStorage → POST to `/api/onboarding` → clear localStorage → redirect to `/onboarding?step=payoff`
4. `/onboarding` page detects `?step=payoff` + authenticated user → GET `/api/onboarding` → renders S5
5. "Open first lesson" → `/lessons/{startModuleSlug}`

---

## Integration points

### Homepage links

- `Hero.tsx`: "Start learning C++" href changes from `/register` to `/onboarding`
- `Nav.tsx`: "Start learning" href changes from `/register` to `/onboarding`
- `FinalCTA.tsx`: CTA button href changes from `/register` to `/onboarding`
- "Sign in" links remain → `/login`

### Module → lesson slug mapping

Hardcoded in `lib/onboarding/constants.ts`:

Only 5 modules are reachable via the onboarding flow. The map only needs these:

```ts
const MODULE_FIRST_LESSON: Record<string, string> = {
  'variables': '1.1-statements-and-structure',
  'pointers': '12.1-introduction-to-pointers',
  'classes': '14.1-introduction-to-oop',
  'vectors-maps': '16.1-introduction-to-containers',
  'templates': '19.1-function-templates',
};
```

Slugs must be verified against the seeded `lessons` table before implementation.

### Tutor integration

The existing tutor route (`POST /api/tutor`) reads the `onboarding` row to get `background` and `motivation`. These are injected into the tutor system prompt:
- `background === 'new'` → verbose, analogy-rich explanations
- `background === 'some_cpp'` → terse, skip basics
- `motivation` → flavors examples toward the learner's goal

### Lesson rendering (fastTrack)

When `fastTrack === true`, the lesson generation prompt for basics modules gets an additional instruction: compress conceptual intros, lead with C++ specifics (static typing, `int` vs `auto`, compilation model, `&` references). Same lesson IDs, lighter prose.

### Tutor coachmark

On the first exercise of `startModule`, a one-time tooltip on the tutor button: "Stuck? Ask me — I can see your code." Dismissed on click or after 8 seconds. Tracked via `coachmark_shown` in localStorage.

---

## Analytics events (deferred — stubs only)

```
onboarding_started
onboarding_q_answered      { step, value }
placement_started
placement_completed        { score }
goal_set                   { weeklyGoal }
first_lesson_opened        { startModule }
onboarding_abandoned       { lastStep }
```

A `trackEvent(name, props)` helper that logs to `console` in development. The actual analytics backend (table + API route) is deferred to a follow-up.

---

## Out of scope

- Executable sandbox on the landing page (static code card stays)
- Analytics backend / event storage
- Streak / notification system for weekly goals
- Light theme
- Mobile-specific sandbox messaging (deferred per spec)
