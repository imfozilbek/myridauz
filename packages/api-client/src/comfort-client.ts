import {
  DRIVER_HISTORY_PATH,
  favoritePath,
  FAVORITES_PATH,
  favoritesSchema,
  historySchema,
  PASSENGER_HISTORY_PATH,
  type Favorites,
  type HistoryItem,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// "Sevimli haydovchilar" and "Safarlar tarixi" (docs/18, G18).
export function createComfortClient(options: SignedOptions) {
  const { request } = signedRequest(options);
  const history = options.app === 'driver' ? DRIVER_HISTORY_PATH : PASSENGER_HISTORY_PATH;
  return {
    favorites: async (): Promise<Favorites> =>
      favoritesSchema.parse(await (await request(FAVORITES_PATH)).json()),
    save: async (driverId: number): Promise<void> =>
      void (await request(favoritePath(driverId), { method: 'PUT' })),
    forget: async (driverId: number): Promise<void> =>
      void (await request(favoritePath(driverId), { method: 'DELETE' })),
    history: async (): Promise<HistoryItem[]> =>
      historySchema.parse(await (await request(history)).json()).trips,
  };
}

export type ComfortClient = ReturnType<typeof createComfortClient>;
