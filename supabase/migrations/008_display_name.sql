-- 008_display_name.sql — Add display name to user_stats for greeting
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS display_name TEXT;
