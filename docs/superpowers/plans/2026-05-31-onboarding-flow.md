# Onboarding Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 4-screen onboarding questionnaire that routes new learners to the right starting lesson based on their background and motivation.

**Architecture:** A new `(onboarding)` route group with a single `'use client'` page driven by `useReducer`. State lives in localStorage during the pre-auth flow, then gets persisted to a new `onboarding` Postgres table after signup. The flow integrates with the existing tutor system prompt and lesson generation prompts.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind 3, Supabase (Postgres + Auth + RLS), Motion (framer-motion), existing homepage CSS design tokens.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `lib/onboarding/types.ts` | Types: `Background`, `Motivation`, `ModuleId`, `Step`, `OnboardingState`, reducer `Action` union |
| Create | `lib/onboarding/constants.ts` | `MODULE_TITLES`, `MOTIVATION_LINES`, `MODULE_FIRST_LESSON` maps |
| Create | `lib/onboarding/reducer.ts` | Pure reducer + `deriveStartModule` + `placeFromScore` |
| Create | `lib/onboarding/storage.ts` | `saveOnboardingState`, `loadOnboardingState`, `clearOnboardingState` |
| Create | `lib/onboarding/placement-questions.ts` | 5 hardcoded MC questions + `placeFromScore` |
| Create | `lib/onboarding/analytics.ts` | `trackEvent` stub (console.log in dev) |
| Create | `components/onboarding/OptionCard.tsx` | Reusable single-select card with keyboard nav |
| Create | `components/onboarding/ProgressBar.tsx` | `1 / 3` step indicator |
| Create | `components/onboarding/StepBackground.tsx` | S1 — 3 background options |
| Create | `components/onboarding/StepMotivation.tsx` | S2 — 6 motivation options |
| Create | `components/onboarding/StepStartingPoint.tsx` | S3 — branches A/B/C |
| Create | `components/onboarding/PlacementQuiz.tsx` | S3.1 — 5-question placement |
| Create | `components/onboarding/StepWeeklyGoal.tsx` | S4 — goal + skip |
| Create | `components/onboarding/StepPayoff.tsx` | S5 — personalized welcome |
| Create | `app/(onboarding)/layout.tsx` | Minimal dark layout (GeistSans/Mono, design tokens) |
| Create | `app/(onboarding)/onboarding/page.tsx` | `'use client'` — orchestrates flow via useReducer |
| Create | `app/(onboarding)/onboarding.css` | Onboarding-specific styles (option cards, progress bar) |
| Create | `app/api/onboarding/route.ts` | POST (save) + GET (read) onboarding data |
| Create | `infra/supabase/migrations/006_onboarding.sql` | `onboarding` table + RLS |
| Modify | `app/(marketing)/components/Hero.tsx` | Change "Start learning C++" href from `/register` to `/onboarding` |
| Modify | `app/(marketing)/components/Nav.tsx` | Change "Start learning" href from `/register` to `/onboarding` (2 places: desktop + mobile) |
| Modify | `app/(marketing)/components/FinalCTA.tsx` | Change CTA href from `/register` to `/onboarding` |
| Modify | `components/layout/AppShell.tsx` | Add `useEffect` to detect localStorage onboarding data, POST to API, redirect to payoff |
| Modify | `lib/ai/system-prompt.ts` | Add `background` + `motivation` parameters to `buildSystemPrompt`, inject learner context |
| Modify | `app/api/chat/route.ts` | Read onboarding row, pass `background` + `motivation` to `buildSystemPrompt` |
| Modify | `lib/anthropic/prompts.ts` | Add `fastTrack` parameter to `buildLessonSummaryPrompt` for compressed basics |
| Create | `components/tutor/TutorCoachmark.tsx` | One-time tooltip on tutor button: "Stuck? Ask me" |

---

### Task 1: Types and Constants

**Files:**
- Create: `lib/onboarding/types.ts`
- Create: `lib/onboarding/constants.ts`

- [ ] **Step 1: Create types file**

```ts
// lib/onboarding/types.ts

export type Background = "new" | "other_lang" | "some_cpp";

export type Motivation =
  | "interviews"
  | "school"
  | "gamedev"
  | "systems"
  | "competitive"
  | "curious";

export type ModuleId =
  | "variables"
  | "control-flow"
  | "functions"
  | "arrays-strings"
  | "io-streams"
  | "operators"
  | "pointers"
  | "references"
  | "classes"
  | "raii"
  | "vectors-maps"
  | "algorithms"
  | "templates"
  | "move-semantics"
  | "smart-pointers"
  | "concurrency";

export type Step =
  | "background"
  | "motivation"
  | "starting-point"
  | "placement"
  | "weekly-goal"
  | "payoff";

export interface OnboardingState {
  step: Step;
  background: Background | null;
  motivation: Motivation | null;
  startModule: ModuleId | null;
  fastTrack: boolean;
  placementTaken: boolean;
  placementScore: number | null;
  weeklyGoal: number | null;
}

export type Action =
  | { type: "SET_BACKGROUND"; value: Background }
  | { type: "SET_MOTIVATION"; value: Motivation }
  | { type: "SET_START_MODULE"; module: ModuleId; fastTrack?: boolean }
  | { type: "START_PLACEMENT" }
  | { type: "COMPLETE_PLACEMENT"; score: number }
  | { type: "SET_WEEKLY_GOAL"; value: number | null }
  | { type: "GO_BACK" };

export interface OnboardingPayload {
  background: Background;
  motivation: Motivation;
  startModule: ModuleId;
  fastTrack: boolean;
  placementTaken: boolean;
  placementScore: number | null;
  weeklyGoal: number | null;
}

export const INITIAL_STATE: OnboardingState = {
  step: "background",
  background: null,
  motivation: null,
  startModule: null,
  fastTrack: false,
  placementTaken: false,
  placementScore: null,
  weeklyGoal: null,
};
```

- [ ] **Step 2: Create constants file**

The seed script generates slugs via `lessonNumber.toLowerCase().replace(/\./g, "-")`. So `1.1` → `1-1`, `12.1` → `12-1`, etc.

```ts
// lib/onboarding/constants.ts

import type { Motivation } from "./types";

export const MODULE_TITLES: Record<string, string> = {
  variables: "Variables & Basics",
  pointers: "Memory & Pointers",
  classes: "Classes & RAII",
  "vectors-maps": "STL & Containers",
  templates: "Templates & Generics",
};

export const MOTIVATION_LINES: Record<Motivation, string> = {
  interviews:
    "Examples will lean toward the patterns that show up in interviews.",
  gamedev: "Examples will lean toward the kind of code games actually run.",
  systems: "Examples will lean toward low-level, close-to-the-metal code.",
  competitive:
    "Examples will lean toward fast, tight, contest-style code.",
  school: "Examples will track what most courses cover, in order.",
  curious:
    "We’ll keep it concrete — real code, real output, every step.",
};

export const MODULE_FIRST_LESSON: Record<string, string> = {
  variables: "1-1",
  pointers: "12-1",
  classes: "14-1",
  "vectors-maps": "16-1",
  templates: "19-1",
};
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit lib/onboarding/types.ts lib/onboarding/constants.ts 2>&1 | head -20`

If tsc can't resolve without full project context, use: `npx tsc --noEmit`

Expected: No errors from these files.

- [ ] **Step 4: Commit**

```bash
git add lib/onboarding/types.ts lib/onboarding/constants.ts
git commit -m "feat(onboarding): add types and constants"
```

---

### Task 2: Reducer and localStorage

**Files:**
- Create: `lib/onboarding/reducer.ts`
- Create: `lib/onboarding/storage.ts`

- [ ] **Step 1: Create the reducer**

```ts
// lib/onboarding/reducer.ts

import type { OnboardingState, Action, ModuleId } from "./types";

export function placeFromScore(score: number): ModuleId {
  if (score <= 1) return "pointers";
  if (score <= 3) return "vectors-maps";
  return "templates";
}

export function deriveStartModule(s: OnboardingState): ModuleId {
  switch (s.background) {
    case "new":
      return "variables";
    case "other_lang":
      return "variables";
    case "some_cpp":
      if (s.placementTaken && s.placementScore != null)
        return placeFromScore(s.placementScore);
      return s.startModule ?? "pointers";
    default:
      return "variables";
  }
}

const BACK_MAP: Record<string, OnboardingState["step"]> = {
  motivation: "background",
  "starting-point": "motivation",
  placement: "starting-point",
  "weekly-goal": "starting-point",
};

export function onboardingReducer(
  state: OnboardingState,
  action: Action,
): OnboardingState {
  switch (action.type) {
    case "SET_BACKGROUND":
      return { ...state, step: "motivation", background: action.value };

    case "SET_MOTIVATION":
      return { ...state, step: "starting-point", motivation: action.value };

    case "SET_START_MODULE":
      return {
        ...state,
        step: "weekly-goal",
        startModule: action.module,
        fastTrack: action.fastTrack ?? false,
      };

    case "START_PLACEMENT":
      return { ...state, step: "placement" };

    case "COMPLETE_PLACEMENT": {
      const module = placeFromScore(action.score);
      return {
        ...state,
        step: "weekly-goal",
        placementTaken: true,
        placementScore: action.score,
        startModule: module,
      };
    }

    case "SET_WEEKLY_GOAL":
      return { ...state, weeklyGoal: action.value };

    case "GO_BACK": {
      const prev = BACK_MAP[state.step];
      if (!prev) return state;
      return { ...state, step: prev };
    }

    default:
      return state;
  }
}
```

- [ ] **Step 2: Create localStorage helpers**

```ts
// lib/onboarding/storage.ts

import type { OnboardingState } from "./types";
import { INITIAL_STATE } from "./types";

const STORAGE_KEY = "cpproad_onboarding";

export function saveOnboardingState(state: OnboardingState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable — silent fail
  }
}

export function loadOnboardingState(): OnboardingState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingState;
    if (!parsed.step) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearOnboardingState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent fail
  }
}

export function hasOnboardingData(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed?.background != null && parsed?.motivation != null;
  } catch {
    return false;
  }
}

export function getOnboardingPayload(): {
  background: string;
  motivation: string;
  startModule: string;
  fastTrack: boolean;
  placementTaken: boolean;
  placementScore: number | null;
  weeklyGoal: number | null;
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as OnboardingState;
    if (!s.background || !s.motivation || !s.startModule) return null;
    return {
      background: s.background,
      motivation: s.motivation,
      startModule: s.startModule,
      fastTrack: s.fastTrack,
      placementTaken: s.placementTaken,
      placementScore: s.placementScore,
      weeklyGoal: s.weeklyGoal,
    };
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`

Expected: No new errors.

- [ ] **Step 4: Commit**

```bash
git add lib/onboarding/reducer.ts lib/onboarding/storage.ts
git commit -m "feat(onboarding): add reducer and localStorage helpers"
```

---

### Task 3: Placement Questions

**Files:**
- Create: `lib/onboarding/placement-questions.ts`

- [ ] **Step 1: Create placement questions file**

```ts
// lib/onboarding/placement-questions.ts

export interface PlacementQuestion {
  id: number;
  code: string | null;
  question: string;
  options: string[];
  correctIndex: number;
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: 1,
    code: "int x = 5;\nint* p = &x;\n*p = 10;",
    question: "After this code runs, what is the value of x?",
    options: ["5", "10", "Address of x", "Undefined"],
    correctIndex: 1,
  },
  {
    id: 2,
    code: null,
    question:
      "What is the key difference between int& r = x; and int* p = &x;?",
    options: [
      "References cannot be null and cannot be reseated after initialization",
      "References use more memory than pointers",
      "Pointers are faster than references",
      "There is no practical difference",
    ],
    correctIndex: 0,
  },
  {
    id: 3,
    code: null,
    question:
      "When does a stack-allocated object’s destructor run?",
    options: [
      "When you call delete on it",
      "When the program exits",
      "When it goes out of scope",
      "When the garbage collector runs",
    ],
    correctIndex: 2,
  },
  {
    id: 4,
    code: null,
    question: "Which STL container gives O(1) average lookup by key?",
    options: [
      "std::map",
      "std::vector",
      "std::unordered_map",
      "std::list",
    ],
    correctIndex: 2,
  },
  {
    id: 5,
    code: null,
    question: "What does template<typename T> let you write?",
    options: [
      "Code that works with multiple types without rewriting for each one",
      "Code that runs faster by avoiding virtual dispatch",
      "Code that can only be used with primitive types",
      "Code that compiles at runtime instead of compile time",
    ],
    correctIndex: 0,
  },
];

export function scoreAnswers(answers: number[]): number {
  let score = 0;
  for (let i = 0; i < PLACEMENT_QUESTIONS.length; i++) {
    if (answers[i] === PLACEMENT_QUESTIONS[i]!.correctIndex) {
      score++;
    }
  }
  return score;
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`

Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add lib/onboarding/placement-questions.ts
git commit -m "feat(onboarding): add placement quiz questions"
```

---

### Task 4: Analytics Stub

**Files:**
- Create: `lib/onboarding/analytics.ts`

- [ ] **Step 1: Create analytics stub**

```ts
// lib/onboarding/analytics.ts

type EventName =
  | "onboarding_started"
  | "onboarding_q_answered"
  | "placement_started"
  | "placement_completed"
  | "goal_set"
  | "first_lesson_opened"
  | "onboarding_abandoned";

export function trackEvent(
  name: EventName,
  props?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`[analytics] ${name}`, props ?? "");
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/onboarding/analytics.ts
git commit -m "feat(onboarding): add analytics event stubs"
```

---

### Task 5: Database Migration

**Files:**
- Create: `infra/supabase/migrations/006_onboarding.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 006_onboarding.sql — Onboarding questionnaire data

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

- [ ] **Step 2: Commit**

```bash
git add infra/supabase/migrations/006_onboarding.sql
git commit -m "feat(onboarding): add onboarding table migration"
```

- [ ] **Step 3: Apply migration (if Supabase is running locally)**

Run: `npx supabase db push`

If Supabase is not running locally, skip — the migration will be applied on next deploy.

---

### Task 6: API Route

**Files:**
- Create: `app/api/onboarding/route.ts`

- [ ] **Step 1: Create the onboarding API route**

```ts
// app/api/onboarding/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import type { OnboardingPayload } from "@/lib/onboarding/types";

export const dynamic = "force-dynamic";

const VALID_BACKGROUNDS = ["new", "other_lang", "some_cpp"] as const;
const VALID_MOTIVATIONS = [
  "interviews",
  "school",
  "gamedev",
  "systems",
  "competitive",
  "curious",
] as const;

function isValidPayload(body: unknown): body is OnboardingPayload {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  if (!VALID_BACKGROUNDS.includes(b.background as (typeof VALID_BACKGROUNDS)[number]))
    return false;
  if (!VALID_MOTIVATIONS.includes(b.motivation as (typeof VALID_MOTIVATIONS)[number]))
    return false;
  if (typeof b.startModule !== "string" || b.startModule.length === 0) return false;
  if (typeof b.fastTrack !== "boolean") return false;
  if (typeof b.placementTaken !== "boolean") return false;
  if (b.placementScore !== null && typeof b.placementScore !== "number") return false;
  if (b.weeklyGoal !== null && typeof b.weeklyGoal !== "number") return false;
  return true;
}

export async function POST(request: NextRequest) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.session.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidPayload(body)) {
    return NextResponse.json({ error: "Invalid onboarding payload" }, { status: 400 });
  }

  const { error } = await supabase.from("onboarding").upsert(
    {
      user_id: userId,
      background: body.background,
      motivation: body.motivation,
      start_module: body.startModule,
      fast_track: body.fastTrack,
      placement_taken: body.placementTaken,
      placement_score: body.placementScore,
      weekly_goal: body.weeklyGoal,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("Failed to save onboarding data:", error);
    return NextResponse.json({ error: "Failed to save onboarding data" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, startModule: body.startModule });
}

export async function GET() {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.session.user.id;

  const { data, error } = await supabase
    .from("onboarding")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "No onboarding data found" }, { status: 404 });
  }

  return NextResponse.json({
    background: data.background,
    motivation: data.motivation,
    startModule: data.start_module,
    fastTrack: data.fast_track,
    placementTaken: data.placement_taken,
    placementScore: data.placement_score,
    weeklyGoal: data.weekly_goal,
  });
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`

Expected: No new errors. (The `onboarding` table type won't exist in the generated Supabase types until types are regenerated, but the `from("onboarding")` call will be typed as `any` — acceptable until types are regenerated after migration.)

- [ ] **Step 3: Commit**

```bash
git add app/api/onboarding/route.ts
git commit -m "feat(onboarding): add POST/GET API route"
```

---

### Task 7: OptionCard and ProgressBar Components

**Files:**
- Create: `components/onboarding/OptionCard.tsx`
- Create: `components/onboarding/ProgressBar.tsx`

- [ ] **Step 1: Create OptionCard**

```tsx
// components/onboarding/OptionCard.tsx

"use client";

type OptionCardProps = {
  label: string;
  description?: string;
  selected?: boolean;
  onSelect: () => void;
};

export function OptionCard({ label, description, selected, onSelect }: OptionCardProps) {
  return (
    <button
      type="button"
      className="ob-option-card"
      data-selected={selected || undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <span className="ob-option-label">{label}</span>
      {description ? <span className="ob-option-desc">{description}</span> : null}
    </button>
  );
}
```

- [ ] **Step 2: Create ProgressBar**

```tsx
// components/onboarding/ProgressBar.tsx

type ProgressBarProps = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <div className="ob-progress">
      <span className="ob-progress-text">
        {current} / {total}
      </span>
      <div className="ob-progress-track">
        <div
          className="ob-progress-fill"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/OptionCard.tsx components/onboarding/ProgressBar.tsx
git commit -m "feat(onboarding): add OptionCard and ProgressBar components"
```

---

### Task 8: Step Components (S1–S4)

**Files:**
- Create: `components/onboarding/StepBackground.tsx`
- Create: `components/onboarding/StepMotivation.tsx`
- Create: `components/onboarding/StepStartingPoint.tsx`
- Create: `components/onboarding/StepWeeklyGoal.tsx`

- [ ] **Step 1: Create StepBackground (S1)**

```tsx
// components/onboarding/StepBackground.tsx

"use client";

import type { Action, Background } from "@/lib/onboarding/types";
import { OptionCard } from "./OptionCard";
import { ProgressBar } from "./ProgressBar";

type Props = { dispatch: React.Dispatch<Action> };

const OPTIONS: { label: string; description: string; value: Background }[] = [
  {
    label: "New to programming",
    description: "No coding experience yet",
    value: "new",
  },
  {
    label: "I know another language",
    description: "Python, JS, Java, or similar",
    value: "other_lang",
  },
  {
    label: "I’ve written some C or C++",
    description: "Some hands-on experience with C/C++",
    value: "some_cpp",
  },
];

export function StepBackground({ dispatch }: Props) {
  return (
    <div className="ob-step">
      <ProgressBar current={1} total={3} />
      <h1 className="ob-heading">First, where are you starting from?</h1>
      <p className="ob-subtext">This sets your starting point. You can change it anytime.</p>
      <div className="ob-options-stack">
        {OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            description={opt.description}
            onSelect={() => dispatch({ type: "SET_BACKGROUND", value: opt.value })}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create StepMotivation (S2)**

```tsx
// components/onboarding/StepMotivation.tsx

"use client";

import type { Action, Motivation } from "@/lib/onboarding/types";
import { OptionCard } from "./OptionCard";
import { ProgressBar } from "./ProgressBar";

type Props = {
  dispatch: React.Dispatch<Action>;
  onBack: () => void;
};

const OPTIONS: { label: string; value: Motivation }[] = [
  { label: "Coding interviews / jobs", value: "interviews" },
  { label: "School or coursework", value: "school" },
  { label: "Game development", value: "gamedev" },
  { label: "Systems / embedded / robotics", value: "systems" },
  { label: "Competitive programming", value: "competitive" },
  { label: "Just curious", value: "curious" },
];

export function StepMotivation({ dispatch, onBack }: Props) {
  return (
    <div className="ob-step">
      <ProgressBar current={2} total={3} />
      <button type="button" className="ob-back" onClick={onBack} aria-label="Go back">
        &larr;
      </button>
      <h1 className="ob-heading">What are you learning C++ for?</h1>
      <p className="ob-subtext">We&rsquo;ll lean your examples in that direction.</p>
      <div className="ob-options-grid">
        {OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            onSelect={() => dispatch({ type: "SET_MOTIVATION", value: opt.value })}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create StepStartingPoint (S3)**

```tsx
// components/onboarding/StepStartingPoint.tsx

"use client";

import type { Action, Background, ModuleId } from "@/lib/onboarding/types";
import { OptionCard } from "./OptionCard";
import { ProgressBar } from "./ProgressBar";

type Props = {
  background: Background;
  dispatch: React.Dispatch<Action>;
  onBack: () => void;
};

function BranchNew({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  return (
    <>
      <h1 className="ob-heading">We&rsquo;ll start at the beginning.</h1>
      <p className="ob-subtext">
        First program, then variables, then we build up. No setup, no prior knowledge assumed.
      </p>
      <button
        type="button"
        className="ob-primary-btn"
        onClick={() => dispatch({ type: "SET_START_MODULE", module: "variables" })}
      >
        Let&rsquo;s go
      </button>
    </>
  );
}

function BranchOtherLang({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  return (
    <>
      <h1 className="ob-heading">You already code. Want the C++-specific track?</h1>
      <p className="ob-subtext">
        Skip &ldquo;what&rsquo;s a loop.&rdquo; Start where C++ actually differs &mdash; types,
        compilation, and memory.
      </p>
      <div className="ob-options-stack">
        <OptionCard
          label="Yes, skip to what’s different"
          onSelect={() =>
            dispatch({ type: "SET_START_MODULE", module: "variables", fastTrack: true })
          }
        />
        <OptionCard
          label="No, walk me through everything"
          onSelect={() =>
            dispatch({ type: "SET_START_MODULE", module: "variables", fastTrack: false })
          }
        />
      </div>
    </>
  );
}

const SELF_SELECT: { label: string; module: ModuleId }[] = [
  { label: "Memory & pointers", module: "pointers" },
  { label: "Classes & RAII", module: "classes" },
  { label: "STL & templates", module: "vectors-maps" },
];

function BranchSomeCpp({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  return (
    <>
      <h1 className="ob-heading">Where do you want to jump in?</h1>
      <p className="ob-subtext">
        Not sure? Take a 5-question check and we&rsquo;ll place you.
      </p>
      <div className="ob-options-stack">
        {SELF_SELECT.map((opt) => (
          <OptionCard
            key={opt.module}
            label={opt.label}
            onSelect={() => dispatch({ type: "SET_START_MODULE", module: opt.module })}
          />
        ))}
        <OptionCard
          label="Place me with a quick check"
          onSelect={() => dispatch({ type: "START_PLACEMENT" })}
        />
        <OptionCard
          label="Actually, start me from the basics"
          onSelect={() => dispatch({ type: "SET_START_MODULE", module: "variables" })}
        />
      </div>
    </>
  );
}

export function StepStartingPoint({ background, dispatch, onBack }: Props) {
  return (
    <div className="ob-step">
      <ProgressBar current={3} total={3} />
      <button type="button" className="ob-back" onClick={onBack} aria-label="Go back">
        &larr;
      </button>
      {background === "new" && <BranchNew dispatch={dispatch} />}
      {background === "other_lang" && <BranchOtherLang dispatch={dispatch} />}
      {background === "some_cpp" && <BranchSomeCpp dispatch={dispatch} />}
    </div>
  );
}
```

- [ ] **Step 4: Create StepWeeklyGoal (S4)**

```tsx
// components/onboarding/StepWeeklyGoal.tsx

"use client";

import type { Action } from "@/lib/onboarding/types";
import { OptionCard } from "./OptionCard";

type Props = {
  dispatch: React.Dispatch<Action>;
  onBack: () => void;
};

const OPTIONS: { label: string; value: number | null }[] = [
  { label: "Casual — 1 lesson/week", value: 1 },
  { label: "Steady — 3 lessons/week", value: 3 },
  { label: "Serious — 5+ lessons/week", value: 5 },
  { label: "No goal for now", value: null },
];

export function StepWeeklyGoal({ dispatch, onBack }: Props) {
  return (
    <div className="ob-step">
      <button type="button" className="ob-back" onClick={onBack} aria-label="Go back">
        &larr;
      </button>
      <h1 className="ob-heading">Want a weekly target?</h1>
      <p className="ob-subtext">
        Optional. It&rsquo;s a nudge, not a streak you&rsquo;ll lose sleep over.
      </p>
      <div className="ob-options-stack">
        {OPTIONS.map((opt) => (
          <OptionCard
            key={String(opt.value)}
            label={opt.label}
            onSelect={() => dispatch({ type: "SET_WEEKLY_GOAL", value: opt.value })}
          />
        ))}
      </div>
      <button
        type="button"
        className="ob-skip-link"
        onClick={() => dispatch({ type: "SET_WEEKLY_GOAL", value: null })}
      >
        Skip
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit`

Expected: No new errors.

- [ ] **Step 6: Commit**

```bash
git add components/onboarding/StepBackground.tsx components/onboarding/StepMotivation.tsx components/onboarding/StepStartingPoint.tsx components/onboarding/StepWeeklyGoal.tsx
git commit -m "feat(onboarding): add step components S1-S4"
```

---

### Task 9: Placement Quiz Component

**Files:**
- Create: `components/onboarding/PlacementQuiz.tsx`

- [ ] **Step 1: Create PlacementQuiz**

```tsx
// components/onboarding/PlacementQuiz.tsx

"use client";

import { useState, useEffect } from "react";
import type { Action } from "@/lib/onboarding/types";
import { PLACEMENT_QUESTIONS, scoreAnswers } from "@/lib/onboarding/placement-questions";
import { MODULE_TITLES } from "@/lib/onboarding/constants";
import { placeFromScore } from "@/lib/onboarding/reducer";
import { OptionCard } from "./OptionCard";
import { trackEvent } from "@/lib/onboarding/analytics";

type Props = {
  dispatch: React.Dispatch<Action>;
  onBack: () => void;
};

export function PlacementQuiz({ dispatch, onBack }: Props) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ score: number; module: string } | null>(null);
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    if (!tracked) {
      trackEvent("placement_started");
      setTracked(true);
    }
  }, [tracked]);

  const question = PLACEMENT_QUESTIONS[questionIndex];

  function handleAnswer(optionIndex: number) {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    if (questionIndex < PLACEMENT_QUESTIONS.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      const score = scoreAnswers(newAnswers);
      const module = placeFromScore(score);
      setResult({ score, module });
      trackEvent("placement_completed", { score });
    }
  }

  if (result) {
    const title = MODULE_TITLES[result.module] ?? result.module;
    return (
      <div className="ob-step">
        <h1 className="ob-heading">
          Got it &mdash; starting you at <strong>{title}</strong>.
        </h1>
        <p className="ob-subtext">
          Too easy or too hard? Jump anywhere from the path on the left.
        </p>
        <button
          type="button"
          className="ob-primary-btn"
          onClick={() => dispatch({ type: "COMPLETE_PLACEMENT", score: result.score })}
        >
          Continue
        </button>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="ob-step">
      <button type="button" className="ob-back" onClick={onBack} aria-label="Go back">
        &larr;
      </button>
      <p className="ob-quiz-counter">
        {questionIndex + 1} / {PLACEMENT_QUESTIONS.length}
      </p>
      {questionIndex === 0 && (
        <p className="ob-subtext" style={{ marginBottom: 24 }}>
          Five quick ones. No score, no pressure &mdash; just so we don&rsquo;t start you
          somewhere boring.
        </p>
      )}
      {question.code ? (
        <pre className="ob-quiz-code">
          <code>{question.code}</code>
        </pre>
      ) : null}
      <p className="ob-quiz-question">{question.question}</p>
      <div className="ob-options-stack">
        {question.options.map((opt, i) => (
          <OptionCard key={i} label={opt} onSelect={() => handleAnswer(i)} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`

Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/PlacementQuiz.tsx
git commit -m "feat(onboarding): add placement quiz component"
```

---

### Task 10: Payoff Component (S5)

**Files:**
- Create: `components/onboarding/StepPayoff.tsx`

- [ ] **Step 1: Create StepPayoff**

```tsx
// components/onboarding/StepPayoff.tsx

"use client";

import Link from "next/link";
import { MODULE_TITLES, MOTIVATION_LINES, MODULE_FIRST_LESSON } from "@/lib/onboarding/constants";
import type { Motivation } from "@/lib/onboarding/types";
import { trackEvent } from "@/lib/onboarding/analytics";

type Props = {
  firstName: string | null;
  startModule: string;
  motivation: string;
};

export function StepPayoff({ firstName, startModule, motivation }: Props) {
  const moduleTitle = MODULE_TITLES[startModule] ?? startModule;
  const motivationLine = MOTIVATION_LINES[motivation as Motivation] ?? "";
  const lessonSlug = MODULE_FIRST_LESSON[startModule] ?? "1-1";

  return (
    <div className="ob-step">
      <h1 className="ob-heading">
        You&rsquo;re set{firstName ? `, ${firstName}` : ", let’s go"}.
      </h1>
      <p className="ob-subtext">
        Starting you at <strong>{moduleTitle}</strong>. {motivationLine}
      </p>
      <p className="ob-subtext">
        Stuck on anything? Hit <strong>Ask the tutor</strong> in the corner &mdash; it can see
        your code.
      </p>
      <Link
        href={`/lessons/${lessonSlug}`}
        className="ob-primary-btn"
        onClick={() => trackEvent("first_lesson_opened", { startModule })}
      >
        Open first lesson
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/onboarding/StepPayoff.tsx
git commit -m "feat(onboarding): add payoff component"
```

---

### Task 11: Onboarding CSS

**Files:**
- Create: `app/(onboarding)/onboarding.css`

- [ ] **Step 1: Create onboarding styles**

These reuse the same design tokens from `homepage.css` (scoped via `data-page="onboarding"`):

```css
/* app/(onboarding)/onboarding.css */

[data-page="onboarding"] {
  --color-bg: #0a0a0a;
  --color-surface: #0f1115;
  --color-surface-2: #161b22;
  --color-border: #23262d;
  --color-border-strong: #30363d;
  --color-fg: #ededed;
  --color-fg-muted: #8b949e;
  --color-fg-subtle: #6e7681;
  --color-accent: #2f81f7;
  --color-link: #58a6ff;
  --radius-md: 8px;
  --radius-lg: 12px;
  --text-sm: 0.875rem;
  --text-body: 1.0625rem;

  --ob-font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --ob-font-mono: var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace;

  font-family: var(--ob-font-sans);
  background-color: var(--color-bg);
  color: var(--color-fg);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  -webkit-font-smoothing: antialiased;
}

@media (max-width: 640px) {
  [data-page="onboarding"] {
    padding: 32px 16px;
  }
}

/* Step container */
.ob-step {
  width: 100%;
  max-width: 520px;
  position: relative;
}

/* Heading & subtext */
.ob-heading {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--color-fg);
  margin: 0 0 12px;
}

.ob-subtext {
  font-size: var(--text-body);
  line-height: 1.6;
  color: var(--color-fg-muted);
  margin: 0 0 32px;
}

/* Option card */
.ob-option-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding: 20px 24px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  font-family: var(--ob-font-sans);
  transition:
    border-color 150ms ease,
    background-color 150ms ease;
}

.ob-option-card:hover {
  border-color: var(--color-border-strong);
  background-color: var(--color-surface-2);
}

.ob-option-card[data-selected] {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}

.ob-option-card:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.ob-option-label {
  font-size: var(--text-body);
  font-weight: 500;
  color: var(--color-fg);
}

.ob-option-desc {
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
}

/* Option layouts */
.ob-options-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ob-options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (max-width: 520px) {
  .ob-options-grid {
    grid-template-columns: 1fr;
  }
}

/* Progress bar */
.ob-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.ob-progress-text {
  font-size: var(--text-sm);
  color: var(--color-fg-subtle);
  font-variant-numeric: tabular-nums;
}

.ob-progress-track {
  flex: 1;
  height: 2px;
  background: var(--color-border);
  border-radius: 1px;
  overflow: hidden;
}

.ob-progress-fill {
  height: 100%;
  background: var(--color-accent);
  border-radius: 1px;
  transition: width 300ms ease;
}

/* Back button */
.ob-back {
  position: absolute;
  top: 0;
  left: -48px;
  background: none;
  border: none;
  color: var(--color-fg-muted);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 150ms ease;
}

.ob-back:hover {
  color: var(--color-fg);
}

.ob-back:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .ob-back {
    position: static;
    margin-bottom: 16px;
  }
}

/* Primary button */
.ob-primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 24px;
  border-radius: var(--radius-md);
  background-color: #ffffff;
  color: #000000;
  border: 1px solid #ffffff;
  font-family: var(--ob-font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color 150ms ease,
    transform 80ms ease;
}

.ob-primary-btn:hover {
  background-color: rgba(255, 255, 255, 0.92);
}

.ob-primary-btn:active {
  transform: translateY(1px);
}

.ob-primary-btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Skip link */
.ob-skip-link {
  display: block;
  margin-top: 16px;
  background: none;
  border: none;
  color: var(--color-fg-subtle);
  font-family: var(--ob-font-sans);
  font-size: var(--text-sm);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.ob-skip-link:hover {
  color: var(--color-fg-muted);
}

/* Quiz-specific */
.ob-quiz-counter {
  font-size: var(--text-sm);
  color: var(--color-fg-subtle);
  margin: 0 0 16px;
  font-variant-numeric: tabular-nums;
}

.ob-quiz-code {
  margin: 0 0 20px;
  padding: 16px 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--ob-font-mono);
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--color-fg);
  overflow-x: auto;
}

.ob-quiz-question {
  font-size: var(--text-body);
  font-weight: 500;
  color: var(--color-fg);
  margin: 0 0 20px;
  line-height: 1.5;
}

/* Step transition */
.ob-step-enter {
  opacity: 0;
  transform: translateY(8px);
}

.ob-step-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .ob-step-enter {
    opacity: 1;
    transform: none;
  }

  .ob-step-enter-active {
    transition: none;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(onboarding\)/onboarding.css
git commit -m "feat(onboarding): add onboarding stylesheet"
```

---

### Task 12: Onboarding Layout and Page

**Files:**
- Create: `app/(onboarding)/layout.tsx`
- Create: `app/(onboarding)/onboarding/page.tsx`

- [ ] **Step 1: Create the layout**

```tsx
// app/(onboarding)/layout.tsx

import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./onboarding.css";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-page="onboarding"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create the page**

```tsx
// app/(onboarding)/onboarding/page.tsx

"use client";

import { useReducer, useEffect, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onboardingReducer } from "@/lib/onboarding/reducer";
import { INITIAL_STATE } from "@/lib/onboarding/types";
import { saveOnboardingState, loadOnboardingState } from "@/lib/onboarding/storage";
import { trackEvent } from "@/lib/onboarding/analytics";
import { StepBackground } from "@/components/onboarding/StepBackground";
import { StepMotivation } from "@/components/onboarding/StepMotivation";
import { StepStartingPoint } from "@/components/onboarding/StepStartingPoint";
import { StepWeeklyGoal } from "@/components/onboarding/StepWeeklyGoal";
import { StepPayoff } from "@/components/onboarding/StepPayoff";
import { PlacementQuiz } from "@/components/onboarding/PlacementQuiz";
import type { Action } from "@/lib/onboarding/types";

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPayoff = searchParams.get("step") === "payoff";

  const [state, rawDispatch] = useReducer(
    onboardingReducer,
    INITIAL_STATE,
    (initial) => loadOnboardingState() ?? initial,
  );

  const [payoffData, setPayoffData] = useState<{
    firstName: string | null;
    startModule: string;
    motivation: string;
  } | null>(null);

  useEffect(() => {
    trackEvent("onboarding_started");
  }, []);

  useEffect(() => {
    if (!isPayoff) {
      saveOnboardingState(state);
    }
  }, [state, isPayoff]);

  useEffect(() => {
    if (isPayoff) {
      fetch("/api/onboarding")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setPayoffData({
              firstName: null,
              startModule: data.startModule,
              motivation: data.motivation,
            });
          }
        })
        .catch(() => {});

      fetch("/api/auth/session")
        .catch(() => {});
    }
  }, [isPayoff]);

  const dispatch = useCallback(
    (action: Action) => {
      rawDispatch(action);

      if (action.type === "SET_BACKGROUND") {
        trackEvent("onboarding_q_answered", { step: "background", value: action.value });
      } else if (action.type === "SET_MOTIVATION") {
        trackEvent("onboarding_q_answered", { step: "motivation", value: action.value });
      } else if (action.type === "SET_START_MODULE") {
        trackEvent("onboarding_q_answered", {
          step: "start",
          value: action.module,
          fastTrack: action.fastTrack,
        });
      } else if (action.type === "SET_WEEKLY_GOAL") {
        trackEvent("goal_set", { weeklyGoal: action.value });
        setTimeout(() => router.push("/register"), 0);
      }
    },
    [router],
  );

  const handleBack = useCallback(() => {
    rawDispatch({ type: "GO_BACK" });
  }, []);

  if (isPayoff && payoffData) {
    return (
      <StepPayoff
        firstName={payoffData.firstName}
        startModule={payoffData.startModule}
        motivation={payoffData.motivation}
      />
    );
  }

  if (isPayoff && !payoffData) {
    return <div className="ob-step"><p className="ob-subtext">Loading...</p></div>;
  }

  switch (state.step) {
    case "background":
      return <StepBackground dispatch={dispatch} />;
    case "motivation":
      return <StepMotivation dispatch={dispatch} onBack={handleBack} />;
    case "starting-point":
      return (
        <StepStartingPoint
          background={state.background!}
          dispatch={dispatch}
          onBack={handleBack}
        />
      );
    case "placement":
      return <PlacementQuiz dispatch={dispatch} onBack={handleBack} />;
    case "weekly-goal":
      return <StepWeeklyGoal dispatch={dispatch} onBack={handleBack} />;
    default:
      return <StepBackground dispatch={dispatch} />;
  }
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`

Expected: No new errors.

- [ ] **Step 4: Verify the page renders**

Run: `npm run dev`

Navigate to `http://localhost:3000/onboarding`. Expected: S1 (Background) screen renders with 3 option cards on a dark background. Clicking an option advances to S2. Back arrow on S2 returns to S1.

- [ ] **Step 5: Commit**

```bash
git add app/\(onboarding\)/layout.tsx app/\(onboarding\)/onboarding/page.tsx
git commit -m "feat(onboarding): add layout and page orchestrator"
```

---

### Task 13: Post-Signup Handoff in AppShell

**Files:**
- Modify: `components/layout/AppShell.tsx`

- [ ] **Step 1: Add onboarding handoff effect**

Add this import at the top of `components/layout/AppShell.tsx`:

```ts
import { useRouter } from "next/navigation";
```

And add to existing imports from `next/navigation`:

The file currently imports `usePathname` — add `useRouter` to that import.

Then add the handoff `useEffect` inside the `AppShell` component, after the existing code and before the `return`:

```ts
const router = useRouter();

useEffect(() => {
  async function syncOnboarding() {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem("cpproad_onboarding");
    } catch {
      return;
    }
    if (!raw) return;

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }

    if (!parsed.background || !parsed.motivation || !parsed.startModule) return;

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          background: parsed.background,
          motivation: parsed.motivation,
          startModule: parsed.startModule,
          fastTrack: parsed.fastTrack ?? false,
          placementTaken: parsed.placementTaken ?? false,
          placementScore: parsed.placementScore ?? null,
          weeklyGoal: parsed.weeklyGoal ?? null,
        }),
      });

      if (res.ok) {
        localStorage.removeItem("cpproad_onboarding");
        router.push("/onboarding?step=payoff");
      }
    } catch {
      // Network error — will retry on next app load
    }
  }

  syncOnboarding();
}, [router]);
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`

Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add components/layout/AppShell.tsx
git commit -m "feat(onboarding): add post-signup handoff in AppShell"
```

---

### Task 14: Homepage Link Updates

**Files:**
- Modify: `app/(marketing)/components/Hero.tsx`
- Modify: `app/(marketing)/components/Nav.tsx`
- Modify: `app/(marketing)/components/FinalCTA.tsx`

- [ ] **Step 1: Update Hero.tsx**

In `app/(marketing)/components/Hero.tsx`, change line 57:

```tsx
// Before:
<Link href="/register" className="hp-btn hp-btn-primary hp-btn-lg">
// After:
<Link href="/onboarding" className="hp-btn hp-btn-primary hp-btn-lg">
```

- [ ] **Step 2: Update Nav.tsx**

In `app/(marketing)/components/Nav.tsx`, change both "Start learning" links.

Line 120 (desktop):
```tsx
// Before:
<Link href="/register" className="hp-btn hp-btn-primary">
// After:
<Link href="/onboarding" className="hp-btn hp-btn-primary">
```

Line 155 (mobile overlay):
```tsx
// Before:
<Link
  href="/register"
  className="hp-btn hp-btn-primary hp-btn-lg"
// After:
<Link
  href="/onboarding"
  className="hp-btn hp-btn-primary hp-btn-lg"
```

- [ ] **Step 3: Update FinalCTA.tsx**

In `app/(marketing)/components/FinalCTA.tsx`, change line 21:

```tsx
// Before:
<Link href="/register" className="hp-btn hp-btn-primary hp-btn-lg">
// After:
<Link href="/onboarding" className="hp-btn hp-btn-primary hp-btn-lg">
```

- [ ] **Step 4: Verify the links work**

Run: `npm run dev`

Navigate to `http://localhost:3000`. Click "Start learning C++" — it should navigate to `/onboarding`. The "Sign in" links should still go to `/login`.

- [ ] **Step 5: Commit**

```bash
git add app/\(marketing\)/components/Hero.tsx app/\(marketing\)/components/Nav.tsx app/\(marketing\)/components/FinalCTA.tsx
git commit -m "feat(onboarding): route homepage CTAs to /onboarding"
```

---

### Task 15: Tutor System Prompt Integration

**Files:**
- Modify: `lib/ai/system-prompt.ts`
- Modify: `app/api/chat/route.ts`

- [ ] **Step 1: Extend buildSystemPrompt**

In `lib/ai/system-prompt.ts`, add two optional parameters to the `buildSystemPrompt` function's `params` object:

```ts
export function buildSystemPrompt(params: {
  tier: number;
  chapterTitle: string;
  lessonTitle: string;
  editorCode: string;
  executionResult: string | null;
  learnerBackground?: string | null;
  learnerMotivation?: string | null;
}): string {
```

Then, after the `HINT TIER` section in the prompt string (after ``${tierInstruction}``), add:

```ts
  let learnerContext = "";
  if (params.learnerBackground || params.learnerMotivation) {
    const verbosity =
      params.learnerBackground === "new"
        ? "Use analogy-rich, beginner-friendly explanations."
        : params.learnerBackground === "some_cpp"
          ? "Be concise — they know C++ basics."
          : "They know programming but not C++ — skip general concepts, focus on C++ specifics.";
    learnerContext = `\n\n[LEARNER CONTEXT]\nBackground: ${params.learnerBackground ?? "unknown"}\nMotivation: ${params.learnerMotivation ?? "unknown"}\n${verbosity}`;
  }
```

Insert `${learnerContext}` into the prompt string after the tier instruction and before `[CURRENT LESSON]`.

- [ ] **Step 2: Read onboarding data in chat route**

In `app/api/chat/route.ts`, after the `loadLessonContext` call (around line 89), add:

```ts
  const { data: onboardingData } = await supabase
    .from("onboarding")
    .select("background, motivation")
    .eq("user_id", userId)
    .single();
```

Then update the `buildSystemPrompt` call to pass the learner context:

```ts
  const systemPrompt = buildSystemPrompt({
    tier,
    chapterTitle: lessonContext.chapterTitle,
    lessonTitle: lessonContext.lessonTitle,
    editorCode: body.code ?? "",
    executionResult,
    learnerBackground: onboardingData?.background ?? null,
    learnerMotivation: onboardingData?.motivation ?? null,
  });
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`

Expected: No new errors.

- [ ] **Step 4: Commit**

```bash
git add lib/ai/system-prompt.ts app/api/chat/route.ts
git commit -m "feat(onboarding): inject learner context into tutor system prompt"
```

---

### Task 16: End-to-End Manual Test

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Test the full happy path**

1. Go to `http://localhost:3000` — click "Start learning C++"
2. Should navigate to `/onboarding` — see S1 (Background)
3. Click "New to programming" → S2 (Motivation) appears
4. Click back arrow → returns to S1 with no prior selection shown
5. Click "New to programming" again → S2
6. Click "Just curious" → S3 (Starting Point, Branch A for `new`)
7. Click "Let's go" → S4 (Weekly Goal)
8. Click "Skip" → redirects to `/register`
9. Create an account → after signup, should redirect to `/onboarding?step=payoff`
10. Payoff screen shows "You're set, let's go." with module and motivation line
11. Click "Open first lesson" → navigates to `/lessons/1-1`

- [ ] **Step 3: Test placement path**

1. Go to `/onboarding` (clear localStorage first via devtools)
2. Select "I've written some C or C++" → S2 → pick any motivation → S3 (Branch C)
3. Click "Place me with a quick check" → placement quiz appears
4. Answer all 5 questions → result screen shows module placement
5. Click Continue → S4 (Weekly Goal)
6. Pick "Steady — 3 lessons/week" → redirects to `/register`

- [ ] **Step 4: Test localStorage persistence**

1. Start onboarding, get to S2
2. Refresh the page
3. Should resume at S2 (not reset to S1)

- [ ] **Step 5: Run lint and type check**

```bash
npx tsc --noEmit && npm run lint
```

Expected: No errors.

- [ ] **Step 6: Final commit with any fixes**

If any fixes were needed during testing:

```bash
git add -A
git commit -m "fix(onboarding): address issues found during manual testing"
```

---

### Task 17: FastTrack Lesson Prompt Modifier

**Files:**
- Modify: `lib/anthropic/prompts.ts`
- Modify: `lib/content/lesson-generation.ts`
- Modify: `app/api/lessons/[slug]/route.ts`

- [ ] **Step 1: Add fastTrack parameter to buildLessonSummaryPrompt**

In `lib/anthropic/prompts.ts`, add an optional `fastTrack` parameter to `buildLessonSummaryPrompt`:

```ts
export function buildLessonSummaryPrompt(
  lesson: string,
  chapter: string,
  priorTitles: string[],
  tags: string[],
  fastTrack?: boolean,
): PromptPayload {
```

Then add a conditional fast-track instruction to the user message, before "Write the lesson summary.":

```ts
const fastTrackNote = fastTrack
  ? "\nFAST-TRACK MODE: The learner already knows programming in another language. Skip general programming concepts (what a variable is, what a loop does). Lead with C++ specifics: static typing, int vs auto, compilation model, & references, header files. Compress conceptual intros to one sentence max."
  : "";
```

And append `${fastTrackNote}` to the user message content before the final "Write the lesson summary." line.

- [ ] **Step 2: Thread fastTrack through lesson generation**

In `lib/content/lesson-generation.ts`, the `generateAndPersist` function calls `buildLessonSummaryPrompt`. It needs access to the `fastTrack` flag. Add an optional `fastTrack` parameter:

```ts
async function generateAndPersist(
  supabase: AppSupabaseClient,
  lesson: Lesson,
  userId?: string,
  fastTrack?: boolean,
): Promise<{ lesson: Lesson; exercises: ExerciseWithTestCases[] }> {
```

Pass it through to `buildLessonSummaryPrompt`:

```ts
const summaryPrompt = buildLessonSummaryPrompt(
  lessonTitle,
  chapterLabel,
  priorTitles,
  lesson.tags ?? [],
  fastTrack,
);
```

And update `getOrGenerateLesson` to accept and pass it:

```ts
export async function getOrGenerateLesson(
  supabase: AppSupabaseClient,
  slug: string,
  userId?: string,
  fastTrack?: boolean,
): Promise<LessonContent> {
```

Pass `fastTrack` to `generateAndPersist` on cache miss.

- [ ] **Step 3: Read fastTrack in lesson route**

In `app/api/lessons/[slug]/route.ts`, after auth, read the onboarding row to get `fast_track`:

```ts
const { data: onboardingData } = await supabase
  .from("onboarding")
  .select("fast_track")
  .eq("user_id", userId)
  .single();

const fastTrack = onboardingData?.fast_track ?? false;
```

Pass `fastTrack` to `getOrGenerateLesson`.

Note: `fastTrack` only affects cache-miss generation. If a lesson was already generated without fast-track, the cached version is returned. This is acceptable — regeneration can be triggered manually if needed.

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`

Expected: No new errors.

- [ ] **Step 5: Commit**

```bash
git add lib/anthropic/prompts.ts lib/content/lesson-generation.ts app/api/lessons/\[slug\]/route.ts
git commit -m "feat(onboarding): add fastTrack modifier to lesson generation prompt"
```

---

### Task 18: Tutor Coachmark

**Files:**
- Create: `components/tutor/TutorCoachmark.tsx`
- Modify: `components/tutor/TutorPanel.tsx`

- [ ] **Step 1: Create TutorCoachmark component**

```tsx
// components/tutor/TutorCoachmark.tsx

"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "cpproad_coachmark_shown";

export function TutorCoachmark() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
      setVisible(true);
      localStorage.setItem(STORAGE_KEY, "1");

      const timer = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(timer);
    } catch {
      // localStorage unavailable
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        right: 0,
        background: "var(--color-surface-2, #161b22)",
        border: "1px solid var(--color-border-strong, #30363d)",
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: "0.8125rem",
        color: "var(--color-fg, #ededed)",
        whiteSpace: "nowrap",
        zIndex: 10,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
      role="status"
    >
      Stuck? Ask me &mdash; I can see your code.
      <button
        onClick={() => setVisible(false)}
        style={{
          background: "none",
          border: "none",
          color: "var(--color-fg-muted, #8b949e)",
          marginLeft: 8,
          cursor: "pointer",
          fontSize: "0.75rem",
        }}
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Add coachmark to TutorPanel**

In `components/tutor/TutorPanel.tsx`, import and render the coachmark near the tutor toggle button. The exact placement depends on the existing TutorPanel structure — position the `<TutorCoachmark />` as a sibling of the tutor open/toggle button, wrapped in a `position: relative` container so the absolutely-positioned coachmark tooltip appears above the button.

```tsx
import { TutorCoachmark } from "./TutorCoachmark";
```

Add `<TutorCoachmark />` adjacent to the tutor trigger button.

- [ ] **Step 3: Verify it appears once**

Run: `npm run dev`

Navigate to a lesson page. The coachmark should appear above the tutor button, auto-dismiss after 8 seconds or on click. Refresh — it should not appear again.

- [ ] **Step 4: Commit**

```bash
git add components/tutor/TutorCoachmark.tsx components/tutor/TutorPanel.tsx
git commit -m "feat(onboarding): add one-time tutor coachmark tooltip"
```

---

### Task 19: Build Verification

- [ ] **Step 1: Run production build**

```bash
npm run build
```

Expected: Build succeeds with no errors. There may be warnings about the `onboarding` table type not being in the generated Supabase types — this is expected until `npx supabase gen types typescript` is re-run after the migration is applied.

- [ ] **Step 2: Run lint and format check**

```bash
npm run lint && npx prettier --check .
```

Fix any issues found.

- [ ] **Step 3: Commit if any build/lint fixes needed**

```bash
git add -A
git commit -m "fix(onboarding): resolve build and lint errors"
```
