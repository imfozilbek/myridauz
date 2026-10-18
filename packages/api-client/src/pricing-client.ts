import {
  ADMIN_DIRECTIONS_PATH,
  ADMIN_DISTANCE_HISTORY_PATH,
  ADMIN_PRICING_PATH,
  ADMIN_PRICING_PREVIEW_PATH,
  ADMIN_PRICING_ROLLBACK_PATH,
  directionsSchema,
  distanceHistorySchema,
  LOCATION_DISTANCE_PATH,
  pricingPreviewSchema,
  pricingStateSchema,
  type Direction,
  type DirectionPrice,
  type Distance,
  type DistanceHistory,
  type PricingPreview,
  type PricingState,
  type PricingVariables,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// The team changes the price formula and the directions in the admin Mini App (docs/23).
export function createPricingClient(options: SignedOptions) {
  const { request, post, putJson } = signedRequest(options);
  const state = async (response: Response) => pricingStateSchema.parse(await response.json());
  const directions = async (response: Response) => directionsSchema.parse(await response.json()).directions;
  return {
    state: async (): Promise<PricingState> => state(await request(ADMIN_PRICING_PATH)),
    preview: async (variables: PricingVariables): Promise<PricingPreview> =>
      pricingPreviewSchema.parse(await (await post(ADMIN_PRICING_PREVIEW_PATH, variables)).json()),
    save: async (variables: PricingVariables): Promise<PricingState> =>
      state(await post(ADMIN_PRICING_PATH, variables)),
    rollback: async (version: number): Promise<PricingState> =>
      state(await post(ADMIN_PRICING_ROLLBACK_PATH, { version })),
    directions: async (): Promise<Direction[]> => directions(await request(ADMIN_DIRECTIONS_PATH)),
    setDirection: async (input: DirectionPrice): Promise<Direction[]> =>
      directions(await putJson(ADMIN_DIRECTIONS_PATH, input)),
    // The owner corrects the road km of a direction; who, when, before and after stay (G45, docs/48).
    setDistance: async (input: Distance): Promise<void> =>
      void (await putJson(LOCATION_DISTANCE_PATH, input)),
    distanceHistory: async (from: string, to: string): Promise<DistanceHistory> => {
      const query = new URLSearchParams({ from, to });
      return distanceHistorySchema.parse(
        await (await request(`${ADMIN_DISTANCE_HISTORY_PATH}?${query}`)).json(),
      );
    },
  };
}

export type PricingClient = ReturnType<typeof createPricingClient>;
