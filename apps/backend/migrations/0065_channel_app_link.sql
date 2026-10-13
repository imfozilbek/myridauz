-- G80, owner decision 4 (docs/176): the own invite link «Rida ilovasi» of each channel. The hourly
-- check makes it once through the bot of the posts; the app opens it, so Telegram counts who joined
-- from the app apart from the posts and the site.
ALTER TABLE channel_health ADD COLUMN app_link TEXT;
