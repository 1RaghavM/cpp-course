-- 011_chapters_rls.sql — Enable RLS on chapters for consistency
-- The chapters table from 001_schema.sql never had RLS enabled.  Every other
-- table does; writes are performed with the service role (which bypasses RLS),
-- so a permissive read policy is all that's needed for authenticated users.

ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS read_chapters ON chapters;
CREATE POLICY read_chapters ON chapters FOR SELECT TO authenticated
  USING (true);
