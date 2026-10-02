-- G28: «Bot xabarlari» in the profile (docs/88 L1). 1: the person turned off the news of the bot:
-- new trips and requests of a subscription and the reminders. Booking messages always go.
ALTER TABLE users ADD COLUMN news_off INTEGER NOT NULL DEFAULT 0;
