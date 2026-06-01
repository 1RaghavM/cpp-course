-- 006_onboarding.sql — Onboarding questionnaire data

CREATE TABLE onboarding (
    user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    background      TEXT NOT NULL CHECK (background IN ('new', 'other_lang', 'some_cpp')),
    motivation      TEXT NOT NULL CHECK (motivation IN (
                        'interviews', 'school', 'gamedev',
                        'systems', 'competitive', 'curious')),
    start_module    TEXT NOT NULL,
    fast_track      BOOLEAN NOT NULL DEFAULT false,
    placement_taken BOOLEAN NOT NULL DEFAULT false,
    placement_score SMALLINT CHECK (placement_score BETWEEN 0 AND 5),
    weekly_goal     SMALLINT CHECK (weekly_goal IN (1, 3, 5)),
    created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY onboarding_owner ON onboarding
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
