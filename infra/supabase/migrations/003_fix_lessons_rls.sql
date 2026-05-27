-- 003_fix_lessons_rls.sql — Allow authenticated users to read lessons
-- The curriculum content (lessons) should be readable by any authenticated user.
-- Write operations still require owner check.

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS only_me ON lessons;

-- Allow all authenticated users to SELECT lessons
CREATE POLICY read_lessons ON lessons FOR SELECT TO authenticated
    USING (true);

-- Only owner can INSERT/UPDATE/DELETE (using service role key for seeding bypasses this)
CREATE POLICY write_lessons ON lessons FOR INSERT TO authenticated
    WITH CHECK (auth.jwt() ->> 'email' = current_setting('app.owner_email', true));

CREATE POLICY update_lessons ON lessons FOR UPDATE TO authenticated
    USING (auth.jwt() ->> 'email' = current_setting('app.owner_email', true))
    WITH CHECK (auth.jwt() ->> 'email' = current_setting('app.owner_email', true));

CREATE POLICY delete_lessons ON lessons FOR DELETE TO authenticated
    USING (auth.jwt() ->> 'email' = current_setting('app.owner_email', true));
