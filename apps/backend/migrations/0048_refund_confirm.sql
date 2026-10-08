-- The refund of a no-show (docs/35, G63): a moderator proposes it with the decision, the owner
-- confirms or rejects it once. The proposals waiting for the owner are read through the index.
ALTER TABLE complaints ADD COLUMN refund_state TEXT
  CHECK (refund_state IN ('proposed', 'confirmed', 'rejected'));
ALTER TABLE complaints ADD COLUMN refund_proposed_by INTEGER;
ALTER TABLE complaints ADD COLUMN refund_proposed_at INTEGER;
ALTER TABLE complaints ADD COLUMN refund_decided_by INTEGER;
ALTER TABLE complaints ADD COLUMN refund_decided_at INTEGER;
CREATE INDEX complaints_refund ON complaints (refund_state);
