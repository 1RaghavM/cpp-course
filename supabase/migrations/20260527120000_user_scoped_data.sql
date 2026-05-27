-- 005_user_scoped_data.sql — Per-user progress, submissions, conversations, and usage
-- Replaces global single-user rows with user_id-scoped data and RLS on auth.uid().
-- Safe to re-run: skips schema changes if user_id is already present.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'progress'
      AND column_name = 'user_id'
  ) THEN
    RAISE NOTICE '005_user_scoped_data already applied — skipping schema/data migration';
    RETURN;
  END IF;

  -- Legacy rows cannot be attributed to a user.
  DELETE FROM messages;
  DELETE FROM conversations;
  DELETE FROM submissions;
  DELETE FROM progress;
  DELETE FROM token_usage;

  ALTER TABLE progress DROP CONSTRAINT IF EXISTS progress_pkey;
  ALTER TABLE progress
    ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
  ALTER TABLE progress ADD PRIMARY KEY (user_id, lesson_id);

  ALTER TABLE submissions
    ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

  ALTER TABLE conversations
    ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

  ALTER TABLE token_usage
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_submissions_user_exercise
  ON submissions(user_id, exercise_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_user_lesson
  ON conversations(user_id, lesson_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_token_usage_user_created
  ON token_usage(user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- RLS: drop owner-email policies
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS only_me ON progress;
DROP POLICY IF EXISTS only_me ON submissions;
DROP POLICY IF EXISTS only_me ON conversations;
DROP POLICY IF EXISTS only_me ON messages;
DROP POLICY IF EXISTS only_me ON token_usage;
DROP POLICY IF EXISTS only_me ON exercises;
DROP POLICY IF EXISTS only_me ON test_cases;

-- ---------------------------------------------------------------------------
-- RLS: user-scoped policies (re-create idempotently)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS own_progress ON progress;
CREATE POLICY own_progress ON progress FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS own_submissions ON submissions;
CREATE POLICY own_submissions ON submissions FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS own_conversations ON conversations;
CREATE POLICY own_conversations ON conversations FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS own_messages ON messages;
CREATE POLICY own_messages ON messages FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS own_token_usage ON token_usage;
CREATE POLICY own_token_usage ON token_usage FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS read_exercises ON exercises;
CREATE POLICY read_exercises ON exercises FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS read_test_cases ON test_cases;
CREATE POLICY read_test_cases ON test_cases FOR SELECT TO authenticated
  USING (true);
