import type { BookingStatus } from '@platform/contracts';
import type { IconName } from '../icons';

// A status of a booking has its own icon: a check when confirmed, a cross-out when it stopped.
const ICONS: Record<BookingStatus, IconName> = {
  requested: 'search',
  confirmed: 'selected',
  completed: 'selected',
  declined: 'blocked',
  expired: 'blocked',
  cancelled_by_passenger: 'blocked',
  cancelled_by_driver: 'blocked',
};
export const bookingIcon = (status: BookingStatus): IconName => ICONS[status];

// A booking that can still be cancelled by the person.
export const cancellable = (status: BookingStatus) => status === 'requested' || status === 'confirmed';
