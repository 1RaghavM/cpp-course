-- 016_github_connections.sql
-- One GitHub OAuth connection per user for submission mirroring.
-- Token stored AES-256-GCM encrypted (see lib/crypto/api-keys.ts).

CREATE TABLE github_connections (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_login    TEXT NOT NULL,
  repo_full_name  TEXT NOT NULL,          -- e.g. "octocat/cpproad-submissions"
  encrypted_token TEXT NOT NULL,          -- ciphertext from encryptApiKey()
  iv              TEXT NOT NULL,
  auth_tag        TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;

-- User may read/delete only their own row. Inserts/updates happen server-side
-- via the service-role client in the OAuth callback (bypasses RLS), never the browser.
CREATE POLICY "own connection select" ON github_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own connection delete" ON github_connections
  FOR DELETE USING (auth.uid() = user_id);
