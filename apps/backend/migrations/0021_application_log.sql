-- G21 (docs/65 C): every decision on a driver application. Rows are only added: the team sees
-- the history of a driver, not only the last answer.
CREATE TABLE application_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  reasons TEXT NOT NULL,
  decided_by INTEGER NOT NULL,
  decided_at INTEGER NOT NULL
);
CREATE INDEX application_log_user ON application_log (user_id, decided_at);
CREATE INDEX driver_applications_plate ON driver_applications (car_plate);
