-- 012_playground_runs.sql — Persistent playground run log for rate-limiting
-- The in-memory Map used by app/api/playground/run/route.ts doesn't survive
-- across Vercel serverless invocations.  This table records each run so the
-- route can count recent rows per user within a sliding window.

CREATE TABLE IF NOT EXISTS playground_runs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playground_runs_user_created
  ON playground_runs(user_id, created_at DESC);

ALTER TABLE playground_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS own_playground_runs ON playground_runs;
CREATE POLICY own_playground_runs ON playground_runs FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Retention helper: deletes rows older than 24h.  Not scheduled here — call
-- it from a cron job, pg_cron, or an admin route when needed.
CREATE OR REPLACE FUNCTION cleanup_playground_runs()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM playground_runs WHERE created_at < now() - interval '24 hours';
$$;
