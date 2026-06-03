-- 002_rls.sql — Row-Level Security for cpproad
-- Enable RLS on every table except chapters (public read is fine).
-- Single policy per table: only the configured owner email can access rows.

-- Enable RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- Allow only the configured owner email
CREATE POLICY only_me ON lessons FOR ALL TO authenticated
    USING (auth.jwt() ->> 'email' = current_setting('app.owner_email'));

CREATE POLICY only_me ON exercises FOR ALL TO authenticated
    USING (auth.jwt() ->> 'email' = current_setting('app.owner_email'));

CREATE POLICY only_me ON test_cases FOR ALL TO authenticated
    USING (auth.jwt() ->> 'email' = current_setting('app.owner_email'));

CREATE POLICY only_me ON submissions FOR ALL TO authenticated
    USING (auth.jwt() ->> 'email' = current_setting('app.owner_email'));

CREATE POLICY only_me ON progress FOR ALL TO authenticated
    USING (auth.jwt() ->> 'email' = current_setting('app.owner_email'));

CREATE POLICY only_me ON conversations FOR ALL TO authenticated
    USING (auth.jwt() ->> 'email' = current_setting('app.owner_email'));

CREATE POLICY only_me ON messages FOR ALL TO authenticated
    USING (auth.jwt() ->> 'email' = current_setting('app.owner_email'));

CREATE POLICY only_me ON token_usage FOR ALL TO authenticated
    USING (auth.jwt() ->> 'email' = current_setting('app.owner_email'));
