import type { Booking, Offer, Trip } from '@platform/contracts';

// What opens from a passenger on «Mening safarim»: the booking, the chat, the call or the wallet.
export type RiderScreen = 'booking' | 'request' | 'chat' | 'call' | 'not_enough';

// The screen open over «Mening safarim», by what it needs (G63).
export type Opened =
  | { readonly screen: Exclude<RiderScreen, 'booking'>; readonly booking: Booking }
  | { readonly screen: 'map' | 'change' };

// What opens over the trip of a link at once (G76, docs/165): the buttons of the block at the bottom
// lead right to «Safar tugadi» with its stars, or to the map of the way.
export type TripScreen = 'end' | 'map';

export type OwnTripProps = {
  readonly trip: Trip;
  // The bookings of this trip, fresh on each signal (docs/64).
  readonly bookings: readonly Booking[];
  readonly onBack: () => void;
  // One booking with its deadline, points, cancel and complaint (DriverBooking, by its id).
  readonly onBooking: (booking: Booking) => void;
  readonly onChanged: () => void;
  // The trip was cancelled: back to the list.
  readonly onClosed: () => void;
  // The offer on a private trip of a «Boʻsh salon kerak» request (G64).
  readonly offer?: Offer | null;
  readonly start?: TripScreen;
};
