-- 010_drop_owner_email_policies.sql — Remove single-owner RLS policies
-- All content tables (lessons, exercises, test_cases) are written via
-- service role and read by any authenticated user.  The owner_email
-- write policies from 003_fix_lessons_rls.sql are dead code.

DROP POLICY IF EXISTS write_lessons  ON lessons;
DROP POLICY IF EXISTS update_lessons ON lessons;
DROP POLICY IF EXISTS delete_lessons ON lessons;
