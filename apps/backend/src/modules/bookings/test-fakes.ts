// Test helper: people, the bot messages and the recommended price, without Telegram and other modules.
import type { Person } from '../users';
import type { BookingsDeps } from './application/ports';
import { publicIdOf } from '../../test-people';

export const DRIVER = 1;
export const DILNOZA = 10;
export const ALI = 11;
export const OLIM = 12;

const person = (id: number, firstName: string, gender: Person['gender']): Person => ({
  id,
  publicId: publicIdOf(id),
  firstName,
  avatarKey: `avatars/${id}`,
  gender,
});

export const fakePeople = () =>
  new Map([
    [DRIVER, person(DRIVER, 'Jasur', 'male')],
    [DILNOZA, person(DILNOZA, 'Dilnoza', 'female')],
    [ALI, person(ALI, 'Ali', 'male')],
    [OLIM, person(OLIM, 'Olim', 'male')],
  ]);

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
  progress: async (booking, step) => void notes.push(`close ones: ${booking.passenger.firstName} ${step}`),
  offerAnswered: async (_driverId, accepted) =>
    void notes.push(`offer ${accepted ? 'accepted' : 'declined'}`),
});
