import { loadBrand } from '@platform/brands';
import type { Booking } from '@platform/contracts';
import type { Bindings } from '../../env';
import { placesOf } from '../locations';
import { notify } from '../notifications';
import type { DriverTrip, SharesDeps, ShareUpdate } from './application/ports';
import { tellTripCancelled } from './application/driver-shares';
import { tellFollowers } from './application/shares';
import { shareRoutes } from './http/share-routes';
import { d1Shares } from './infrastructure/d1-shares';
import { createMemoryShares } from './infrastructure/memory-shares';
import { prepareCard } from './infrastructure/prepared-card';
import { shareTexts } from './infrastructure/share-texts';

const localShares = createMemoryShares();
// The card's button opens the passenger bot, which gives the Mini App in the follow mode (docs/43).
const FOLLOW_START = 'follow_';

const base = (env: Bindings) => {
  const brand = loadBrand(env.BRAND);
  return {
    shares: env.DB ? d1Shares(env.DB) : localShares,
    texts: shareTexts(brand, async (id) => (await placesOf(env)).get(id)?.name ?? id),
    notify: (jobs: Parameters<SharesDeps['notify']>[0]) => notify(env, jobs),
    link: (token: string) => `https://t.me/${brand.bots.passenger}?start=${FOLLOW_START}${token}`,
  };
};

// The booking comes from the bookings module, the driver's trip from trips, given by the app (app.ts).
type BookingOf = (env: Bindings, id: string) => Promise<Booking | undefined>;
type DriverTripOf = (env: Bindings, id: string) => Promise<DriverTrip | undefined>;

const sharesDeps = (env: Bindings, bookingOf: BookingOf, driverTripOf: DriverTripOf): SharesDeps => ({
  ...base(env),
  booking: (id) => bookingOf(env, id),
  driverTrip: (id) => driverTripOf(env, id),
  prepare: (bot, userId, text, link) =>
    prepareCard(
      (input, init) => fetch(input, init),
      bot === 'passenger' ? env.PASSENGER_BOT_TOKEN : env.DRIVER_BOT_TOKEN,
      userId,
      text,
      link,
    ),
  now: Date.now,
});

export const sharesModule = (bookingOf: BookingOf, driverTripOf: DriverTripOf) =>
  shareRoutes((env) => sharesDeps(env, bookingOf, driverTripOf));

// A driver cancelled a shared trip: the family hears it once and the links close (G18).
export const tellTripFamily = (env: Bindings, tripId: string, driverTripOf: DriverTripOf) =>
  tellTripCancelled(
    sharesDeps(env, async () => undefined, driverTripOf),
    tripId,
  );

// For bookings: "mashinaga chiqdi", "yetib keldi", "bekor qilindi" to close people (docs/43).
export const tellCloseOnes = (env: Bindings, booking: Booking, update: ShareUpdate) =>
  tellFollowers(base(env), booking, update);
