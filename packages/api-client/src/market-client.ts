import {
  ADMIN_TRIPS_PATH,
  DRIVER_REQUESTS_PATH,
  DRIVER_TRIPS_PATH,
  driverTripCancelPath,
  PASSENGER_REQUESTS_PATH,
  passengerRequestCancelPath,
  PRICE_RECOMMENDATION_PATH,
  recommendationSchema,
  rideRequestSchema,
  rideRequestsSchema,
  tripPath,
  tripSchema,
  tripsSchema,
  TRIPS_PATH,
  type Recommendation,
  type RequestSearch,
  type RideRequest,
  type RideRequestInput,
  type Trip,
  type TripInput,
  type Point,
  type TripSearch,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

const query = (params: Record<string, string | undefined>) =>
  new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );

// Trips, ride requests and the recommended price (docs/09, G07), for the three Mini Apps.
export function createMarketClient(options: SignedOptions) {
  const { request, post } = signedRequest(options);
  const trip = async (response: Response) => tripSchema.parse(await response.json());
  const rideRequest = async (response: Response) => rideRequestSchema.parse(await response.json());
  return {
    recommend: async (from: string, to: string): Promise<Recommendation> =>
      recommendationSchema.parse(
        await (await request(`${PRICE_RECOMMENDATION_PATH}?${query({ from, to })}`)).json(),
      ),
    // The points go as «lat,lng»: the trips that suit the way come first (docs/70).
    searchTrips: async ({ pickup, dropoff, ...rest }: TripSearch): Promise<Trip[]> => {
      const at = (point?: Point) => (point ? `${point.lat},${point.lng}` : undefined);
      const asked = query({ ...rest, pickup: at(pickup), dropoff: at(dropoff) });
      return tripsSchema.parse(await (await request(`${TRIPS_PATH}?${asked}`)).json()).trips;
    },
    trip: async (id: string): Promise<Trip> => trip(await request(tripPath(id))),
    myTrips: async (): Promise<Trip[]> =>
      tripsSchema.parse(await (await request(DRIVER_TRIPS_PATH)).json()).trips,
    publishTrip: async (input: TripInput): Promise<Trip> => trip(await post(DRIVER_TRIPS_PATH, input)),
    cancelTrip: async (id: string): Promise<Trip> => trip(await post(driverTripCancelPath(id), {})),
    searchRequests: async (search: RequestSearch): Promise<RideRequest[]> =>
      rideRequestsSchema.parse(await (await request(`${DRIVER_REQUESTS_PATH}?${query(search)}`)).json())
        .requests,
    myRequests: async (): Promise<RideRequest[]> =>
      rideRequestsSchema.parse(await (await request(PASSENGER_REQUESTS_PATH)).json()).requests,
    publishRequest: async (input: RideRequestInput): Promise<RideRequest> =>
      rideRequest(await post(PASSENGER_REQUESTS_PATH, input)),
    cancelRequest: async (id: string): Promise<RideRequest> =>
      rideRequest(await post(passengerRequestCancelPath(id), {})),
    // The admin Mini App: the trips from yesterday on, to look at (not to approve).
    teamTrips: async (): Promise<Trip[]> =>
      tripsSchema.parse(await (await request(ADMIN_TRIPS_PATH)).json()).trips,
  };
}

export type MarketClient = ReturnType<typeof createMarketClient>;
