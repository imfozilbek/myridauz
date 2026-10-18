-- G87 V6: the reactions on the posts of trips in the channels (docs/176) as Telegram counts them
-- (message_reaction_count: anonymous, only a number), and when they last changed.
ALTER TABLE channel_posts ADD COLUMN reactions INTEGER NOT NULL DEFAULT 0;
ALTER TABLE channel_posts ADD COLUMN reacted_at INTEGER;
CREATE INDEX channel_posts_message ON channel_posts (channel, message_id);
CREATE INDEX channel_posts_reacted ON channel_posts (reacted_at) WHERE reacted_at IS NOT NULL;
