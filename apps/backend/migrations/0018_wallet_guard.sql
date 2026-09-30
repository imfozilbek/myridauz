-- G20 (docs/65 A4): two confirmations at the same moment never take more than the balance holds.
-- The check and the new row are one step inside the database; the batch of a charge fails as a whole.
CREATE TRIGGER wallet_no_overdraw
BEFORE INSERT ON wallet_operations
WHEN NEW.kind = 'commission' AND NEW.amount + (
  SELECT COALESCE(SUM(amount), 0) FROM wallet_operations
  WHERE driver_id = NEW.driver_id AND balance = NEW.balance
) < 0
BEGIN
  SELECT RAISE(ABORT, 'wallet.overdraw');
END;
