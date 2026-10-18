-- The bot of the Mini App the person opened last: it knows the person, so the team opens their
-- Telegram profile through it, also without a public name (owner, 18.10.2026).
ALTER TABLE telegram_names ADD COLUMN bot TEXT NOT NULL DEFAULT 'passenger';
