// Who cancelled a confirmed booking decides the refund (docs/12): the passenger → back to the
// wallet; the driver → no refund, against cancelling after a booking.
export type Canceller = 'passenger' | 'driver';
export const refundsCommission = (by: Canceller) => by === 'passenger';
