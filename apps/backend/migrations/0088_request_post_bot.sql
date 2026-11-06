-- G94 (owner, 06.11.2026, docs/223): the bot that sent the post of a request, so it closes the post
-- too: the group bot from now on, the poster before.
ALTER TABLE request_posts ADD COLUMN bot TEXT NOT NULL DEFAULT 'poster';
