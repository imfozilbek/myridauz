-- A person as the apps see them: a random public id, never the Telegram ID (docs/07, docs/65 A3).
ALTER TABLE users ADD COLUMN public_id TEXT;
UPDATE users SET public_id = lower(hex(randomblob(16)));
CREATE UNIQUE INDEX users_public_id ON users (public_id);
