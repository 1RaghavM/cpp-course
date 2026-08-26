-- Add status column for conversation reset (archive + new)
ALTER TABLE conversations ADD COLUMN status text NOT NULL DEFAULT 'active';

-- One active conversation per (user, lesson) pair
CREATE UNIQUE INDEX idx_conversations_active
  ON conversations (user_id, lesson_id) WHERE status = 'active';

-- Add feedback column for thumbs up/down
ALTER TABLE messages ADD COLUMN feedback text;

-- Add conversation_id to token_usage for per-conversation cost tracking
ALTER TABLE token_usage ADD COLUMN conversation_id uuid
  REFERENCES conversations(id) ON DELETE SET NULL;
CREATE INDEX idx_token_usage_conversation ON token_usage (conversation_id);
