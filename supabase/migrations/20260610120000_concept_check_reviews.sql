-- 20260610120000_concept_check_reviews.sql — Phase B retention engine state.
-- One row per (user_id, check_id) storing SM-2-lite scheduler state.
-- The reviews row is upserted alongside the attempts INSERT via a single RPC
-- so the two tables can never diverge.

CREATE TABLE IF NOT EXISTS concept_check_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_id UUID NOT NULL REFERENCES concept_checks(id) ON DELETE CASCADE,
  interval_index INT NOT NULL CHECK (interval_index BETWEEN 0 AND 4),
  next_due DATE NOT NULL,
  last_correct BOOLEAN NOT NULL,
  last_answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, check_id)
);

CREATE INDEX IF NOT EXISTS idx_ccr_user_due
  ON concept_check_reviews(user_id, next_due);

ALTER TABLE concept_check_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS own_concept_check_reviews ON concept_check_reviews;
CREATE POLICY own_concept_check_reviews ON concept_check_reviews FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Atomic "write both tables" RPC.
-- The caller (TS) has already computed the new review state in pure TS and
-- passes the parameters in. This RPC contains zero business logic — it only
-- guarantees the two writes happen in one transaction.
CREATE OR REPLACE FUNCTION record_check_attempt(
  p_check_id UUID,
  p_correct BOOLEAN,
  p_interval_index INT,
  p_next_due DATE
) RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  INSERT INTO concept_check_attempts (user_id, check_id, correct)
  VALUES (v_user_id, p_check_id, p_correct);

  INSERT INTO concept_check_reviews
    (user_id, check_id, interval_index, next_due, last_correct, last_answered_at)
  VALUES (v_user_id, p_check_id, p_interval_index, p_next_due, p_correct, now())
  ON CONFLICT (user_id, check_id) DO UPDATE SET
    interval_index = EXCLUDED.interval_index,
    next_due = EXCLUDED.next_due,
    last_correct = EXCLUDED.last_correct,
    last_answered_at = EXCLUDED.last_answered_at;
END;
$$;

GRANT EXECUTE ON FUNCTION record_check_attempt(UUID, BOOLEAN, INT, DATE) TO authenticated;
