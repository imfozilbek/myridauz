-- G30: the bot a person wrote to (docs/50): the answer of the team goes back from the same bot.
-- 'support' for the support bot; the earlier copies came from the admin bot.
ALTER TABLE support_links ADD COLUMN bot TEXT NOT NULL DEFAULT 'admin';
