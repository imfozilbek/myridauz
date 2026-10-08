import {
  ADMIN_TRIPS_PATH,
  DRIVER_REQUESTS_PATH,
  DRIVER_SCHEDULE_PATH,
  DRIVER_TRIPS_PATH,
  directionCardsSchema,
  driverTripCancelPath,
  PASSENGER_REQUESTS_PATH,
  passengerRequestCancelPath,
  PRICE_RECOMMENDATION_PATH,
  recommendationSchema,
  rideRequestSchema,
  rideRequestsSchema,
  scheduleSchema,
  tripArrivePath,
  tripDepartPath,
  tripPath,
  tripPricePath,
  tripTimePath,
  tripSchema,
  tripsSchema,
  TRIPS_PATH,
  TRIP_DAYS_PATH,
  TRIP_DIRECTIONS_PATH,
  tripDaysSchema,
  type DirectionCard,
  type Recommendation,
  type RequestSearch,
  type RideRequest,
  type RideRequestInput,
  type Schedule,
  type Trip,
  type TripInput,
  type TripDays,
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
    searchTrips: async (search: TripSearch): Promise<Trip[]> =>
      tripsSchema.parse(await (await request(`${TRIPS_PATH}?${query(search)}`)).json()).trips,
    trip: async (id: string): Promise<Trip> => trip(await request(tripPath(id))),
    // How many trips go where (G59): the cards of «Qayerga borasiz?» and the days of «Safarlar».
    directions: async (from: string): Promise<DirectionCard[]> =>
      directionCardsSchema.parse(await (await request(`${TRIP_DIRECTIONS_PATH}?${query({ from })}`)).json())
        .directions,
    tripDays: async (from: string, to: string): Promise<TripDays> =>
      tripDaysSchema.parse(await (await request(`${TRIP_DAYS_PATH}?${query({ from, to })}`)).json()),
    myTrips: async (): Promise<Trip[]> =>
      tripsSchema.parse(await (await request(DRIVER_TRIPS_PATH)).json()).trips,
    publishTrip: async (input: TripInput): Promise<Trip> => trip(await post(DRIVER_TRIPS_PATH, input)),
    // The busy times of the driver for a new trip on this route (docs/103).
    schedule: async (from: string, to: string): Promise<Schedule> =>
      scheduleSchema.parse(await (await request(`${DRIVER_SCHEDULE_PATH}?${query({ from, to })}`)).json()),
    cancelTrip: async (id: string): Promise<Trip> => trip(await post(driverTripCancelPath(id), {})),
    // The driver moves the time later or lowers the price (G39, docs/104).
    retimeTrip: async (id: string, departAt: number): Promise<Trip> =>
      trip(await post(tripTimePath(id), { departAt })),
    lowerTripPrice: async (id: string, price: number): Promise<Trip> =>
      trip(await post(tripPricePath(id), { price })),
    // «Yoʻlga chiqdim» and «Yetib keldik» of the driver (G63, docs/35).
    departTrip: async (id: string): Promise<Trip> => trip(await post(tripDepartPath(id), {})),
    arriveTrip: async (id: string): Promise<Trip> => trip(await post(tripArrivePath(id), {})),
    searchRequests: async (search: RequestSearch): Promise<RideRequest[]> =>
      rideRequestsSchema.parse(await (await request(`${DRIVER_REQUESTS_PATH}?${query(search)}`)).json())
        .requests,
    myRequests: async (): Promise<RideRequest[]> =>
      rideRequestsSchema.parse(await (await request(PASSENGER_REQUESTS_PATH)).json()).requests,
    publishRequest: async (input: RideRequestInput): Promise<RideRequest> =>
      rideRequest(await post(PASSENGER_REQUESTS_PATH, input)),
    cancelRequest: async (id: string): Promise<RideRequest> =>
      rideRequest(await post(passengerRequestCancelPath(id), {})),
    // The admin Mini App: the trips of one day, to look at (not to approve).
    teamTrips: async (date: string): Promise<Trip[]> =>
      tripsSchema.parse(await (await request(`${ADMIN_TRIPS_PATH}?${query({ date })}`)).json()).trips,
  };
}

export type MarketClient = ReturnType<typeof createMarketClient>;
