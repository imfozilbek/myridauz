import type { WalletDeps } from './application/ports';

// The links of «Hamyon» to bookings and trips in tests: none, the commission rule of the brand, no bot.
export const NO_LINKS: Pick<
  WalletDeps,
  'bookings' | 'booking' | 'lastPrice' | 'perSeat' | 'fewSeats' | 'tell'
> = {
  bookings: async () => new Map(),
  booking: async () => undefined,
  lastPrice: async () => null,
  perSeat: (price) => Math.max(Math.round(price * 0.1), 3000),
  fewSeats: 5,
  tell: async () => undefined,
};
