import type { Booking } from '@platform/contracts';
import type { TripChange } from '../market/trip-change';

// What opens from a passenger on «Mening safarim»: the booking, the chat, the call or the wallet.
export type RiderScreen = 'booking' | 'chat' | 'call' | 'not_enough';

// The screen open over «Mening safarim», by what it needs (G63).
export type Opened =
  | { readonly screen: Exclude<RiderScreen, 'booking'> | 'top_up'; readonly booking: Booking }
  | { readonly screen: 'map' | 'choice' }
  | { readonly screen: 'change'; readonly change: TripChange };
