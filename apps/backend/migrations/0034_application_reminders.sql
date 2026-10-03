-- G34: the team answers a driver application within the hour. A waiting application reminds its
-- moderator once, then the owners once; a new sending of the application has its own reminders.
CREATE TABLE application_reminders (
  user_id INTEGER NOT NULL,
  submitted_at INTEGER NOT NULL,
  step TEXT NOT NULL,
  sent_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, submitted_at, step)
);
