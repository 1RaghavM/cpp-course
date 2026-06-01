-- 007_user_stats.sql — Dashboard stats + code snippet tracking

CREATE TABLE user_stats (
    user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    streak_days      INT NOT NULL DEFAULT 0,
    last_active_date DATE,
    weekly_goal      INT,
    updated_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own stats" ON user_stats
    FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "users insert own stats" ON user_stats
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "users update own stats" ON user_stats
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

ALTER TABLE progress ADD COLUMN IF NOT EXISTS last_code_snippet TEXT;
