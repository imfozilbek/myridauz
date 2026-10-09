-- The journal of the team (G75, gap К of docs/158): every decision and change of a member, rows only
-- added. since: when the case came (applications, complaints, photos), for the waits of a member.
CREATE TABLE team_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  subject TEXT NOT NULL,
  action TEXT NOT NULL,
  since INTEGER,
  at INTEGER NOT NULL
);
-- The journal of the owner, the newest first; the day of a member.
CREATE INDEX team_actions_at ON team_actions (at);
CREATE INDEX team_actions_member ON team_actions (member_id, at);
