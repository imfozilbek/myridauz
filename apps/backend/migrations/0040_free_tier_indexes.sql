-- G56 (docs/117): the Cron reads only through an index, never a growing table whole.
-- The bonuses whose time ends: the hourly burn finds its drivers here.
CREATE INDEX wallet_bonus_ends ON wallet_operations (expires_at) WHERE balance = 'bonus';
-- The rides that ended: the rating asks.
CREATE INDEX trips_ends ON trips (ends_at);
-- The subscriptions with messages waiting, and the ones whose time is over.
CREATE INDEX route_subscriptions_pending ON route_subscriptions (pending);
CREATE INDEX route_subscriptions_due ON route_subscriptions (expired, expires_at);
-- The decisions of one day: the daily digest of the team.
CREATE INDEX application_log_decided ON application_log (decided_at);
