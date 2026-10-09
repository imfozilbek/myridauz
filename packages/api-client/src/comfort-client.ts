import {
  DRIVER_HISTORY_PATH,
  DRIVER_STANDING_PATH,
  favoritePath,
  FAVORITES_PATH,
  favoritesSchema,
  historySchema,
  PASSENGER_HISTORY_PATH,
  PASSENGER_STANDING_PATH,
  standingSchema,
  type Favorites,
  type HistoryItem,
  type PersonId,
  type Standing,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// "Sevimli haydovchilar" and "Safarlar tarixi" (docs/18, G18), the numbers of «Profil» (G65).
export function createComfortClient(options: SignedOptions) {
  const { request } = signedRequest(options);
  const driver = options.app === 'driver';
  const history = driver ? DRIVER_HISTORY_PATH : PASSENGER_HISTORY_PATH;
  return {
    favorites: async (): Promise<Favorites> =>
      favoritesSchema.parse(await (await request(FAVORITES_PATH)).json()),
    save: async (driverId: PersonId): Promise<void> =>
      void (await request(favoritePath(driverId), { method: 'PUT' })),
    forget: async (driverId: PersonId): Promise<void> =>
      void (await request(favoritePath(driverId), { method: 'DELETE' })),
    history: async (): Promise<HistoryItem[]> =>
      historySchema.parse(await (await request(history)).json()).trips,
    standing: async (): Promise<Standing> =>
      standingSchema.parse(
        await (await request(driver ? DRIVER_STANDING_PATH : PASSENGER_STANDING_PATH)).json(),
      ),
  };
}

export type ComfortClient = ReturnType<typeof createComfortClient>;
