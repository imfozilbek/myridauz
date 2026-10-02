-- G29: the team's trips of a day and the real prices read trips by the time of departure only
-- (docs/90 F-A6, F-A7). trips_search starts with status, so it does not help them.
CREATE INDEX trips_depart ON trips (depart_at);
