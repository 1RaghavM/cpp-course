-- 20260609120000_concept_checks.sql — Concept checks (cached content) + per-user attempts.
-- concept_checks follows the same generate-once/cache-forever model as exercises.
-- concept_check_attempts is per-user data under RLS (substrate for the future review queue).

CREATE TABLE IF NOT EXISTS concept_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('predict_output', 'spot_bug', 'mcq')),
  prompt_md TEXT NOT NULL,
  options JSONB,
  answer TEXT NOT NULL,
  explanation_md TEXT NOT NULL,
  position INT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_model TEXT
);

CREATE INDEX IF NOT EXISTS idx_concept_checks_lesson
  ON concept_checks(lesson_id, position);

CREATE TABLE IF NOT EXISTS concept_check_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_id UUID NOT NULL REFERENCES concept_checks(id) ON DELETE CASCADE,
  correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cc_attempts_user
  ON concept_check_attempts(user_id, check_id, answered_at DESC);

ALTER TABLE concept_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_check_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS read_concept_checks ON concept_checks;
CREATE POLICY read_concept_checks ON concept_checks FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS own_cc_attempts ON concept_check_attempts;
CREATE POLICY own_cc_attempts ON concept_check_attempts FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
