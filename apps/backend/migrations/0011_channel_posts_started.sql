-- A channel post changes when its trip departs (docs/15): the Cron job finds the posts whose trip
-- has left and edits them once.
ALTER TABLE channel_posts ADD COLUMN depart_at INTEGER NOT NULL DEFAULT 0;
ALTER TABLE channel_posts ADD COLUMN closed INTEGER NOT NULL DEFAULT 0;
CREATE INDEX channel_posts_open ON channel_posts (closed, depart_at);
