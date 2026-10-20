-- G89 A4 (owner decision 20.10.2026): a support question stays in «Navbat» until somebody answers it,
-- not 2 days. Only the open questions are read, by their own index (docs/117).
CREATE INDEX assignments_open_support ON assignments (assigned_at) WHERE kind = 'support' AND answered_at IS NULL;
