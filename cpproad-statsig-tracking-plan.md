# cpproad — Statsig Tracking Plan

A complete event taxonomy, user-property schema, metrics layer, and experiment plan for instrumenting cpproad with Statsig. Built around the real product surfaces: the roadmap/curriculum, the code editor + exercises, the AI tutor, onboarding, and the returning-learner dashboard.

> Scope note. SDK call signatures evolve — the API sketches here are conceptual. Confirm exact method names/params against current Statsig docs before wiring. Naming and metric design below are stable regardless of SDK version.

---

## 0. Principles (read first)

1. **Statsig is an event stream, not a system of record.** Your DB (Postgres) is the source of truth for progress, submissions, streaks, and account data. Statsig events can be sampled or dropped; never read them back as authoritative state.
2. **Anchor everything on learning output.** The activation moment is *passing the first exercise*, not viewing a lesson or logging in. Funnels, retention-qualifying events, and the north star all key off `exercise_passed`.
3. **Log derived signals, never raw content.** No source code, no full tutor message text, no raw search queries. Send categories, counts, and buckets instead. This is both a privacy rule and a cardinality rule.
4. **Server-side log anything computed server-side.** Grading results (`exercise_passed`/`failed`), tutor token counts, and API errors are logged from the backend so they can't be tampered with and so cost data is accurate.
5. **Low cardinality wins.** Bucket continuous values (time → ranges, latency → ranges), categorize free text (errors → categories). High-cardinality metadata is expensive and hard to analyze.

---

## 1. Identity model

People browse the cpproad roadmap before signing up, so anonymous → authenticated stitching matters for the signup funnel.

| Phase | Identifier | Notes |
|---|---|---|
| Anonymous (pre-signup) | `stableID` (Statsig-generated, persisted in cookie/storage) | Used for roadmap/lesson-preview events and the top of the signup funnel. |
| Authenticated | `userID` (your opaque account ID — not email) | Set on `signup_completed` and every `login`. Statsig stitches the prior `stableID` activity to this user. |
| Cross-device | keep `stableID` stable per device; rely on `userID` for cross-device joins | Don't try to merge devices manually; `userID` does it. |

**Rules**
- `userID` is your internal account UUID, never the raw email.
- Always pass the same user object (ID + custom fields) to *both* gate checks and event logs in a given request, so experiment exposure and behavior line up.

---

## 2. User properties (the user object)

These live on the Statsig user object and drive **targeting** (who's in an experiment/gate) and **segmentation** (slicing metrics). Keep it lean — only fields you'll actually segment or target on. Moving values (e.g. `lessons_completed_bucket`) are evaluated point-in-time, which is fine for both uses.

| Property | Type | Purpose | Set when | Notes |
|---|---|---|---|---|
| `userID` | string | identity | signup / login | opaque account ID |
| `account_age_days` | number | segment new vs tenured | each session | derive from signup date |
| `platform` | enum `web` / `ios` | platform splits | each init | |
| `app_version` | string | release-gated rollouts, regression checks | each init | |
| `acquisition_source` | string | acquisition cohorts | signup (set once) | utm/referrer category, low-cardinality |
| `skill_level` | enum `beginner`/`some`/`experienced` | personalize + segment | onboarding answer | self-reported |
| `weekly_goal` | number | goal cohorts | onboarding | lessons/week |
| `current_module_id` | string | where they are in curriculum | each session | |
| `lessons_completed_bucket` | enum `0`/`1-3`/`4-10`/`11+` | progress cohorts | each session | bucketed, not raw count |
| `streak_days_bucket` | enum `0`/`1-3`/`4-7`/`8+` | habit cohorts | each session | |
| `has_completed_onboarding` | bool | gate post-onboarding features | after onboarding | |
| `is_minor` | bool | compliance gating | signup (from age bracket) | drives privacy rules — see §6 |
| `country` | string | locale/compliance | auto (Statsig from IP) or set | |

**Do not put on the user object:** email, name, raw age/DOB, IP, raw counts that change every event. Set the user object once per session/request, not per event.

---

## 3. Event taxonomy

**Naming convention:** `object_action`, snake_case, past-tense action (`exercise_passed`, `tutor_opened`). Be ruthlessly consistent — Statsig metrics are built on exact event-name string matches, so a typo creates a phantom metric.

Properties listed are **event metadata** (for analysis/breakdowns), distinct from user properties (for targeting).

### 3.1 Acquisition & landing (mostly anonymous)
| Event | Fires when | Metadata |
|---|---|---|
| `page_view` | any route (autocapture baseline) | `path`, `referrer_category` |
| `roadmap_viewed` | curriculum/roadmap page opens | `entry_source` |
| `lesson_preview_viewed` | anonymous opens a free/locked lesson | `lesson_id`, `module_id` |
| `signup_cta_clicked` | any "sign up / start" button | `location` (`hero`/`navbar`/`lesson_gate`) |

### 3.2 Auth & onboarding
| Event | Fires when | Metadata |
|---|---|---|
| `signup_started` | signup form/oauth begins | `method` (`email`/`google`) |
| `signup_completed` | account created → **identify user here** | `method` |
| `login` | returning auth | `method` |
| `onboarding_started` | first onboarding step shown | — |
| `onboarding_step_viewed` | each step | `step_id`, `step_index` |
| `onboarding_question_answered` | a personalization Q answered | `question_id`, `answer_value` |
| `weekly_goal_set` | goal chosen | `lessons_per_week` |
| `onboarding_completed` | flow finished | `duration_seconds_bucket`, `steps_count` |
| `onboarding_abandoned` | leaves before finishing | `last_step_id` |

### 3.3 Core learning loop (the heart — instrument thoroughly)
| Event | Fires when | Metadata |
|---|---|---|
| `lesson_viewed` | lesson summary opens | `lesson_id`, `module_id`, `difficulty`, `curriculum_position`, `is_first_view` |
| `lesson_summary_completed` | scrolled to end / dwell threshold | `lesson_id`, `dwell_seconds_bucket` |
| `editor_opened` | code editor mounts for an exercise | `exercise_id`, `lesson_id`, `difficulty` |
| `code_run` | learner runs code | `exercise_id`, `run_index`, `compile_ok`, `runtime_bucket` — **no source** |
| `code_compile_failed` | compile error | `exercise_id`, `error_category` (categorized, not raw text) |
| `exercise_submitted` | submit for grading | `exercise_id`, `attempt_number` |
| `exercise_passed` *(server)* | all tests pass | `exercise_id`, `difficulty`, `attempts`, `time_to_pass_seconds_bucket`, `hints_used`, `tutor_used` |
| `exercise_failed` *(server)* | submission fails | `exercise_id`, `attempt_number`, `tests_passed`, `tests_total` |
| `hint_revealed` | a hint is opened | `exercise_id`, `hint_index` |
| `solution_viewed` | full solution revealed (gave up) | `exercise_id`, `attempts_before_reveal` |
| `exercise_abandoned` | leaves an unsolved exercise | `exercise_id`, `attempts`, `dwell_seconds_bucket` |
| `lesson_completed` *(server)* | lesson + its exercises done | `lesson_id`, `module_id` |

### 3.4 AI tutor (engagement **and** cost)
| Event | Fires when | Metadata |
|---|---|---|
| `tutor_opened` | tutor panel opens | `context_type` (`lesson`/`exercise`), `context_id`, `trigger` (`manual`/`proactive`) |
| `tutor_message_sent` | learner sends a message | `context_type`, `message_index` — **no message text** |
| `tutor_response_received` *(server)* | model replies | `latency_ms_bucket`, `tokens_in`, `tokens_out`, `model` |
| `tutor_feedback` | thumbs up/down | `rating` (`up`/`down`) |
| `tutor_closed` | panel closes | `messages_count`, `session_seconds_bucket` |

### 3.5 Progression & habit
| Event | Fires when | Metadata |
|---|---|---|
| `chapter_completed` *(server)* | chapter done | `chapter_id`, `module_id`, `lessons_count` |
| `module_completed` *(server)* | module done | `module_id`, `days_since_start_bucket` |
| `streak_extended` | daily streak +1 | `streak_days` |
| `streak_broken` | streak resets | `previous_streak_days` |
| `weekly_goal_met` | hit weekly target | `lessons_completed` |
| `resume_clicked` | dashboard hero "resume" tapped | `target_lesson_id` |

### 3.6 Dashboard & navigation
| Event | Fires when | Metadata |
|---|---|---|
| `dashboard_viewed` | post-login dashboard loads | — |
| `recommended_next_clicked` | spaced-rep / revisit slot used | `lesson_id`, `reason` (`struggled`/`next`) |
| `search_used` | search executed | `result_count_bucket` — **no raw query** |
| `settings_changed` | a setting toggled | `setting`, `value` |

### 3.7 Errors & performance (guardrails)
| Event | Fires when | Metadata |
|---|---|---|
| `app_error` | client error caught | `error_category`, `surface` — no stack traces with PII |
| `editor_load_time` | editor finishes mounting | `ms_bucket` |
| `code_execution_timeout` | run/grade times out | `exercise_id` |
| `api_error` *(server)* | backend request fails | `endpoint_category`, `status` |

---

## 4. Metrics layer

Define these as Statsig metrics on top of the events above. Tag each so experiments auto-read them.

**North star**
- **Weekly Active Learners (WAL):** unique users with ≥1 `lesson_completed` OR `exercise_passed` in a 7-day window. (Output, not pageviews.)

**Activation (leading retention indicator)**
- % of `signup_completed` users with their first `exercise_passed` within 24h / 7d.

**Core funnel** (build as a Statsig funnel)
- `roadmap_viewed` → `signup_completed` → `onboarding_completed` → `lesson_viewed` → `editor_opened` → `exercise_passed`
- Watch the `editor_opened` → `exercise_passed` step: that's where curriculum difficulty shows up.

**Retention**
- Statsig Day-N / Week-N retention with the **qualifying event = `exercise_passed` or `lesson_completed`** (not `login`). Retention on a meaningful action is the only retention worth reading.

**Engagement**
- Lessons completed per active week (mean).
- Exercises passed per learner.
- Tutor adoption rate = % of WAL with ≥1 `tutor_opened`.

**Learning efficacy (internal product-quality)**
- Median `attempts` to pass, by `exercise_id` / `difficulty` → flags too-hard/too-easy exercises.
- `time_to_pass` distribution by exercise.
- Hint dependency = `hint_revealed` rate per exercise.
- `exercise_abandoned` rate by exercise → difficulty cliffs.
- Lesson drop-off = where in the curriculum `lesson_viewed` stops converting to `lesson_completed`.

**Guardrails**
- **Tutor cost per WAL** = sum(`tokens_in`+`tokens_out`) × price ÷ WAL. (No revenue yet — this is your burn signal.)
- p75 `editor_load_time`.
- `app_error` rate per session.
- `code_execution_timeout` rate.

---

## 5. Feature gates & experiments

### Gates (rollout + kill switches)
| Gate | Use |
|---|---|
| `tutor_enabled` | **kill switch** for the tutor if cost spikes |
| `tutor_proactive_prompts` | offer help after N failed runs |
| `new_onboarding_flow` | staged rollout of a redesigned onboarding |
| `dashboard_recommended_next` | the spaced-rep "revisit" slot |
| `editor_v2` | new editor rollout, guarded by `editor_load_time` |

### Experiments (hypothesis → primary metric)
1. **Onboarding length** — short 3-step vs longer 6-step personalization. *Primary:* 7-day activation. *Guardrail:* `onboarding_completed` rate. (Shorter usually lifts completion but may lower personalization-driven activation — test it.)
2. **Proactive tutor** — offer help after 2 failed runs vs manual-only. *Primary:* `exercise_passed` rate. *Guardrails:* `exercise_abandoned` rate, tutor cost per WAL.
3. **First-exercise difficulty** — trivially easy `intro` first vs jumping to `practice`. *Primary:* activation + Week-1 retention.
4. **Dashboard recommended-next slot** — on vs off. *Primary:* `resume_clicked` / time-to-resume. *Secondary:* Week-1 retention.
5. **Lesson summary length** — 250 vs 400 words. *Primary:* `lesson_completed`, downstream `exercise_passed`.

---

## 6. Privacy, minors & storage rules

**Never send to Statsig:** raw source code, full tutor message text, raw search queries, email/name in plaintext, raw DOB. Send derived/categorical signals only.

**Minors.** Your ToS sets a 13+ floor. For users flagged `is_minor`, be conservative: minimize custom IDs and fingerprinting-style autocapture, and review COPPA (you disallow under-13) and GDPR-K obligations before launch. Flag this for counsel — don't guess.

**Consent.** For EU traffic, gate non-essential analytics behind your cookie/consent banner (GDPR). Anonymous roadmap browsing analytics may need consent depending on jurisdiction.

**Cardinality & volume.** Bucket all times/latencies; categorize all errors. If `code_run` volume explodes, sample it (e.g. log every run but down-sample beyond N/session) — passed/failed events stay unsampled.

**Retention.** Decide an event-retention window with Statsig; don't assume infinite history.

---

## 7. Implementation notes

**SDKs**
- **Web (Next.js):** client SDK with autocapture for `page_view`/clicks as a baseline, plus explicit `logEvent` for the learning loop. 
- **Server (API routes / grader / tutor backend):** server SDK for graded and cost events (`exercise_passed`, `exercise_failed`, `lesson_completed`, `tutor_response_received`, `api_error`). Logging these server-side prevents client tampering and captures real token counts.
- **iOS (if/when there's a mobile client):** iOS SDK sharing the *same* event names and properties.

**Environments.** Use separate dev/staging/prod environment tiers so test events never pollute prod metrics.

**Identify on auth.** Set `userID` + custom fields on `signup_completed` and every `login`; rely on `stableID` before that. Pass the same user object to gate checks and event logs within a request.

**Conceptual sketches** (confirm signatures against current docs):

```ts
// client — custom event
client.logEvent('exercise_passed', exerciseId, {
  difficulty: 'practice',
  attempts: '3',
  time_to_pass_seconds_bucket: '60-180',
  hints_used: '1',
  tutor_used: 'true',
});

// client — experiment exposure
const exp = client.getExperiment('first_exercise_difficulty');
const startDifficulty = exp.get('difficulty', 'intro');

// client — kill switch
if (client.checkGate('tutor_enabled')) { /* render tutor */ }
```

```ts
// server — graded + cost event (authoritative)
statsig.logEvent(
  { userID, customIDs: { stableID } },
  'tutor_response_received',
  null,
  { latency_ms_bucket: '800-1500', tokens_in: '1200', tokens_out: '300', model: 'sonnet' }
);
```

---

## Quick build order

1. SDK init (web client + server) with env tiers; set the user object + identity stitching.
2. Ship §3.2 + §3.3 (auth, onboarding, core loop) — that unlocks the funnel, activation, and retention immediately.
3. Add §3.4 tutor + the cost guardrail.
4. Define §4 metrics; build the activation funnel and retention curve.
5. Stand up the `tutor_enabled` kill switch and your first experiment (onboarding length).
