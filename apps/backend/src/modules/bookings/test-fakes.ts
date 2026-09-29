// Test helper: the bot messages and the recommended price, without Telegram and the pricing module.
import type { BookingsDeps } from './application/ports';

export const fakeRecommend: BookingsDeps['recommend'] = async (from, to) => ({
  ok: true,
  value: {
    from,
    to,
    km: 300,
    price: 90_000,
    source: 'formula',
    minPrice: 30_000,
    maxPrice: 600_000,
    roundStep: 5000,
  },
});

export const fakeNotifier = (notes: string[]): BookingsDeps['notify'] => ({
  requested: async (booking) => void notes.push(`driver: request ${booking.passenger.firstName}`),
  confirmed: async (booking) => void notes.push(`passenger: confirmed ${booking.plate}`),
  declined: async () => void notes.push('passenger: declined'),
  cancelled: async (_booking, by) => void notes.push(`cancelled by ${by}`),
  offered: async (passengerId) => void notes.push(`offer to ${passengerId}`),
  offerAnswered: async (_driverId, accepted) =>
    void notes.push(`offer ${accepted ? 'accepted' : 'declined'}`),
});
