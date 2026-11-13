import { D7_PUBLISHED_MS } from '../domain/tip-windows';
import { stillOpen } from './passenger-stops';

// The stops of a driver (docs/232), bound as the stops of a passenger.

// D1: a draft of an application not sent; a driver changing the car was approved before, not here.
export const D1 = `SELECT a.user_id AS userId FROM driver_applications a
  WHERE a.status = 'draft' AND a.updated_at >= ?1 AND a.updated_at < ?2
    AND NOT EXISTS (SELECT 1 FROM application_log l WHERE l.user_id = a.user_id AND l.status = 'approved')
    AND ${stillOpen('a.user_id')}
  LIMIT ?4`;

// D2: approved and still a driver, no trip yet.
export const D2 = `SELECT DISTINCT l.user_id AS userId FROM application_log l
  JOIN driver_applications a ON a.user_id = l.user_id AND a.status = 'approved'
  WHERE l.decided_at >= ?1 AND l.decided_at < ?2 AND l.status = 'approved'
    AND NOT EXISTS (SELECT 1 FROM trips t WHERE t.driver_id = l.user_id)
    AND ${stillOpen('l.user_id')}
  LIMIT ?4`;

// D7: a trip of its own (not one for a request) leaves in the window without a single booking.
export const D7 = `SELECT t.driver_id AS userId, t.id AS target FROM trips t
  WHERE t.status = 'active' AND t.depart_at >= ?1 AND t.depart_at < ?2
    AND t.for_request IS NULL AND t.departed_at IS NULL AND t.created_at < ?3 - ${D7_PUBLISHED_MS}
    AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.trip_id = t.id)
    AND ${stillOpen('t.driver_id')}
  LIMIT ?4`;

// D4: still a driver, the last trip ended in the window, none published after it.
export const D4 = `SELECT DISTINCT t.driver_id AS userId FROM trips t
  JOIN driver_applications a ON a.user_id = t.driver_id AND a.status = 'approved'
  WHERE t.ends_at >= ?1 AND t.ends_at < ?2
    AND NOT EXISTS (SELECT 1 FROM trips n WHERE n.driver_id = t.driver_id AND n.created_at > t.created_at)
    AND ${stillOpen('t.driver_id')}
  LIMIT ?4`;
