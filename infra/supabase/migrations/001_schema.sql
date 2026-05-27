-- 001_schema.sql — All tables + indexes for cpproad
-- Matches design.md section 3.2 exactly.

-- Curriculum (seeded once from curriculum_seed.json)
CREATE TABLE chapters (
    id              SMALLINT PRIMARY KEY,           -- 0..40
    number          TEXT NOT NULL,                  -- '0', '1', 'O', 'F', 'A'
    learncpp_title  TEXT NOT NULL,
    my_title        TEXT,                           -- my paraphrase, optional
    sort_order      SMALLINT NOT NULL
);

CREATE TABLE lessons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id      SMALLINT NOT NULL REFERENCES chapters(id),
    number          TEXT NOT NULL,                  -- '1.5', 'F.3', '13.x'
    slug            TEXT NOT NULL UNIQUE,
    learncpp_title  TEXT NOT NULL,
    learncpp_url    TEXT NOT NULL,
    my_title        TEXT,                           -- my paraphrase (optional)
    summary_md      TEXT,                           -- LLM-generated; NULL = not yet generated
    summary_generated_at TIMESTAMPTZ,
    summary_model   TEXT,                           -- which model generated this
    tags            TEXT[] DEFAULT '{}',
    sort_order      INTEGER NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_lessons_chapter_sort ON lessons(chapter_id, sort_order);

CREATE TABLE exercises (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id       UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    prompt_md       TEXT NOT NULL,
    starter_code    TEXT NOT NULL,
    difficulty      TEXT NOT NULL DEFAULT 'practice',
    sort_order      SMALLINT NOT NULL,
    generated_at    TIMESTAMPTZ DEFAULT now(),
    generated_model TEXT
);

CREATE TABLE test_cases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id     UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    label           TEXT NOT NULL,
    is_sample       BOOLEAN NOT NULL DEFAULT false,
    stdin           TEXT DEFAULT '',
    expected_stdout TEXT NOT NULL,
    sort_order      SMALLINT NOT NULL
);

-- Submissions
CREATE TABLE submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id     UUID NOT NULL REFERENCES exercises(id),
    mode            TEXT NOT NULL CHECK (mode IN ('run', 'submit')),
    language_std    TEXT NOT NULL DEFAULT 'c++20',
    source_code     TEXT NOT NULL,
    status          TEXT NOT NULL,                  -- compile_error | passed | failed | tle | mle | runtime_error | error
    stdout          TEXT,
    stderr          TEXT,
    compile_output  TEXT,
    exit_code       INTEGER,
    wall_time_ms    INTEGER,
    test_results    JSONB,                          -- [{label, passed, expected, actual}]
    created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_submissions_exercise ON submissions(exercise_id, created_at DESC);

-- Progress (one row per lesson)
CREATE TABLE progress (
    lesson_id       UUID PRIMARY KEY REFERENCES lessons(id) ON DELETE CASCADE,
    state           TEXT NOT NULL DEFAULT 'not_started',  -- not_started | in_progress | completed | skipped
    first_visit_at  TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    last_visit_at   TIMESTAMPTZ DEFAULT now()
);

-- Tutor
CREATE TABLE conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id       UUID REFERENCES lessons(id),
    title           TEXT,                           -- auto from first message
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content         TEXT NOT NULL,
    hint_tier       SMALLINT,                       -- 1..4
    tokens_in       INTEGER,
    tokens_out      INTEGER,
    cached_tokens_in INTEGER,
    model           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_messages_conv ON messages(conversation_id, created_at);

-- Cost tracking
CREATE TABLE token_usage (
    id              BIGSERIAL PRIMARY KEY,
    call_type       TEXT NOT NULL,                  -- lesson_summary | exercise_gen | tutor | other
    model           TEXT NOT NULL,
    tokens_in       INTEGER NOT NULL,
    tokens_out      INTEGER NOT NULL,
    cached_in       INTEGER NOT NULL DEFAULT 0,
    cost_usd_micro  BIGINT NOT NULL,                -- microdollars
    lesson_id       UUID REFERENCES lessons(id),
    created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_token_usage_day ON token_usage(date_trunc('day', created_at));
