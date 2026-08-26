-- 009_playground.sql — Playground state table + conversation context column

-- Playground state: one row per user, stores last editor content
CREATE TABLE IF NOT EXISTS playground_state (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  source_code   TEXT NOT NULL,
  stdin         TEXT NOT NULL DEFAULT '',
  language_std  TEXT NOT NULL DEFAULT 'c++20',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE playground_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS own_playground_state ON playground_state;
CREATE POLICY own_playground_state ON playground_state FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Conversation context: distinguishes playground vs lesson conversations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'context'
  ) THEN
    ALTER TABLE conversations ADD COLUMN context TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_conversations_context
  ON conversations(user_id, context) WHERE context IS NOT NULL;
