-- G80: a channel is the chat the bot names (docs/176): "@" and the name of a public channel or the
-- number of a private one. A post kept by the bare name gets its "@"; the health of the old zones
-- is read again by the Cron for the channels of the directions.
UPDATE channel_posts SET channel = '@' || channel WHERE substr(channel, 1, 1) NOT IN ('@', '-');
DELETE FROM channel_health;
