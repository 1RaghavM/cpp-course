-- 009_bug_reports.sql — User-submitted bug reports from the lesson IDE

CREATE TABLE bug_reports (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id  UUID REFERENCES lessons(id) ON DELETE SET NULL,
    category   TEXT NOT NULL CHECK (category IN ('ui', 'code_execution', 'lesson_content', 'tutor', 'other')),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bug_reports_user ON bug_reports(user_id, created_at DESC);
CREATE INDEX idx_bug_reports_created ON bug_reports(created_at DESC);

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_bug_reports_insert ON bug_reports FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY own_bug_reports_select ON bug_reports FOR SELECT TO authenticated
  USING (user_id = auth.uid());
