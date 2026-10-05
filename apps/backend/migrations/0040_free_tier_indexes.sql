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
-- The main numbers of the dashboard: each count reads only its period.
CREATE INDEX users_created ON users (created_at);
CREATE INDEX trips_created ON trips (created_at);
CREATE INDEX bookings_created ON bookings (created_at);
CREATE INDEX driver_applications_submitted ON driver_applications (submitted_at);
CREATE INDEX complaints_created ON complaints (created_at);
-- The search of a passenger: only the trips from the places of the search, not every trip of the day.
CREATE INDEX trips_from ON trips (from_id, status, depart_at);
