import type { WalletDeps } from './application/ports';

// The links of «Hamyon» to bookings and trips in tests: none, and the commission rule of the brand.
export const NO_LINKS: Pick<WalletDeps, 'bookings' | 'booking' | 'lastPrice' | 'perSeat'> = {
  bookings: async () => new Map(),
  booking: async () => undefined,
  lastPrice: async () => null,
  perSeat: (price) => Math.max(Math.round(price * 0.1), 3000),
};
