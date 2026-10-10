import type { Booking } from '@platform/contracts';

// What opens from a passenger on «Mening safarim»: the booking, the chat, the call or the wallet.
export type RiderScreen = 'booking' | 'chat' | 'call' | 'not_enough';

// The screen open over «Mening safarim», by what it needs (G63).
export type Opened =
  | { readonly screen: Exclude<RiderScreen, 'booking'>; readonly booking: Booking }
  | { readonly screen: 'map' | 'change' };
