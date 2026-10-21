// The writes of table trips (migrations 0007, 0035, 0043, 0046, 0051, 0080, 0086). A change never
// touches the status nor the marks of the road (G89 T7).
export const UPSERT = `INSERT INTO trips (id, driver_id, from_id, to_id, depart_at, depart_until, ends_at, km,
  seats, price, woman_on_board, comment, status, pickup_mode, created_at, car_make, car_model,
  car_color, car_plate, first_depart_at, first_price, price_told_at, booking_rule, for_request, pitak_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (id) DO UPDATE SET depart_at = excluded.depart_at, depart_until = excluded.depart_until,
  ends_at = excluded.ends_at, price = excluded.price, price_told_at = excluded.price_told_at,
  for_request = excluded.for_request
  WHERE trips.status IN ('active', 'full') AND trips.departed_at IS NULL`;

// «Yoʻlga chiqdim», «Yetib keldik» and the cancel (G63): one conditional write each, like the confirm
// of a booking; a cancel, a departure, the completion Cron or a second tap that came first wins.
export const LIVE = "status IN ('active', 'full')";
export const DEPART = `UPDATE trips SET departed_at = ? WHERE id = ? AND departed_at IS NULL AND ${LIVE}`;
// Without «Yoʻlga chiqdim» the last departure, the end of a range, counts (onTheWay, docs/216).
const LAST_DEPART = 'COALESCE(depart_until, depart_at)';
export const ARRIVE = `UPDATE trips SET departed_at = COALESCE(departed_at, ${LAST_DEPART}), arrived_at = ?
  WHERE id = ? AND arrived_at IS NULL AND ${LIVE} AND (departed_at IS NOT NULL OR ${LAST_DEPART} <= ?)`;
// The Cron of departures: the start bounds the index, the last departure the window (docs/216).
export const NOT_DEPARTED = `SELECT * FROM trips WHERE ${LIVE} AND depart_at >= ? AND depart_at <= ?
  AND ${LAST_DEPART} >= ? AND ${LAST_DEPART} <= ? AND departed_at IS NULL`;
export const CANCEL = `UPDATE trips SET status = 'cancelled' WHERE id = ? AND ${LIVE} AND departed_at IS NULL`;
