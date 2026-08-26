-- 015_capstones.sql
-- End-of-part capstone projects. One row per stage, 5 milestones per capstone.

CREATE TABLE capstones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                -- 'basics' | 'memory-oop' | 'stl-templates' | 'advanced'
  stage TEXT NOT NULL,                      -- matches Stage type in lib/dashboard/types
  title TEXT NOT NULL,
  description_md TEXT NOT NULL,
  language_standard TEXT NOT NULL DEFAULT 'c++20',
  compile_flags TEXT[] NOT NULL,
  starter_code TEXT NOT NULL,
  reference_solution TEXT NOT NULL,         -- private, never returned by API
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE capstone_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capstone_id UUID NOT NULL REFERENCES capstones(id) ON DELETE CASCADE,
  ordinal INT NOT NULL CHECK (ordinal BETWEEN 1 AND 5),
  title TEXT NOT NULL,
  spec_anchor TEXT NOT NULL,
  tests JSONB NOT NULL,                     -- [{name, stdin, expected_stdout, timeout_ms}, ...]
  UNIQUE (capstone_id, ordinal)
);

CREATE TABLE capstone_attempts (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES capstone_milestones(id) ON DELETE CASCADE,
  passed BOOLEAN NOT NULL,
  submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
  last_attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, milestone_id)
);

ALTER TABLE capstones ENABLE ROW LEVEL SECURITY;
ALTER TABLE capstone_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE capstone_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read capstones"
  ON capstones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated read capstone_milestones"
  ON capstone_milestones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users select own capstone_attempts"
  ON capstone_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own capstone_attempts"
  ON capstone_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own capstone_attempts"
  ON capstone_attempts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_capstone_attempts_milestone_id ON capstone_attempts(milestone_id);

-- SECURITY: RLS is row-level, not column-level. The "Authenticated read
-- capstones" policy above (USING (true)) lets any logged-in user SELECT
-- reference_solution directly via the anon-key client — the comment on that
-- column ("private, never returned by API") was not actually enforced; only
-- app-layer stripping in lib/capstones/server.ts#fetchPublicCapstone()
-- protected it, and that's bypassable from the browser with the anon key.
-- Column-level privilege closes this at the database layer.
--
-- Paired app change (already shipped): lib/capstones/server.ts no longer
-- selects this column at all. Nothing on the read path ever consumed it —
-- grading runs milestone tests, not the reference solution — so the column is
-- write-only from the app's perspective, populated by scripts/seed_capstones.ts
-- via the service role (which bypasses both RLS and column privileges).
-- No route needs escalating to a service-role client as a result of this.
REVOKE SELECT (reference_solution) ON capstones FROM authenticated, anon;
