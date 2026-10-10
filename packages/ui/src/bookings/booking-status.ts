import type { BookingStatus } from '@platform/contracts';

// A booking that can still be cancelled by the person.
export const cancellable = (status: BookingStatus) => status === 'requested' || status === 'confirmed';
