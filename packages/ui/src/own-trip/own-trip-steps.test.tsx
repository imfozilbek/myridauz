import { ApiError, type FeedbackClient } from '@platform/api-client';
import type { Trip } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed, wallet } from '../bookings/booking-test-kit';
import { openOwnTrip, renderMarket, tap, trip } from '../market/market-test-kit';
import { MyTripsScreen } from '../market/my-trips-screen';
import type { TripAgain } from '../market/trip-draft';
import type { Route } from '../places/route-screen';
import { testClients } from '../test-shell';

// The publishing is a flow of its own (G63 C1): here only what the way back hands it.
type Publish = { readonly route: Route; readonly again: TripAgain; readonly onPublished?: () => void };
vi.mock('../market/new-trip-flow', () => ({
  NewTripFlow: ({ route, again, onPublished }: Publish) => (
    <button type="button" onClick={onPublished}>
      {`publish ${route.from.id} ${route.to.id} ${again.date ?? ''} ${again.seats} [${again.comment}]`}
    </button>
  ),
}));

afterEach(cleanup);

const MINUTE = 60 * 1000;
const rider = { ...confirmed, id: 'b2' };
const left: Trip = { ...trip, seatsLeft: 1, departedAt: trip.departAt - 20 * MINUTE };

type Steps = { readonly departTrip?: () => Promise<Trip>; readonly arriveTrip?: () => Promise<Trip> };
function open(shown: Trip, steps: Steps, review = vi.fn<FeedbackClient['review']>(async () => undefined)) {
  const myTrips = vi.fn(async () => [shown]);
  const view = renderMarket(
    <MyTripsScreen onBack={() => undefined} />,
    testClients({
      market: { myTrips, searchRequests: async () => [], ...steps },
      bookings: { driverBookings: async () => [rider], driverOffers: async () => [] },
      feedback: { review },
      wallet: { mine: async () => wallet },
    }),
  );
  return { myTrips, tracked: view.tracked };
}

async function openTrip() {
  await openOwnTrip();
}

describe('«Yoʻlga chiqdim» and «Yetib keldik» on the server (G63 B1, docs/35)', { timeout: 20_000 }, () => {
  it('a double tap departs once, then the page reloads', async () => {
    vi.setSystemTime(trip.departAt - 30 * MINUTE);
    let release: () => void = () => undefined;
    const departTrip = vi.fn(
      () => new Promise<Trip>((resolve) => (release = () => resolve({ ...trip, departedAt: Date.now() }))),
    );
    const { myTrips } = open(trip, { departTrip });
    await openTrip();
    const button = await screen.findByText('Yoʻlga chiqdim');
    fireEvent.click(button);
    fireEvent.click(button);
    release();
    await vi.waitFor(() => expect(myTrips).toHaveBeenCalledTimes(2));
    fireEvent.click(button);
    expect(departTrip).toHaveBeenCalledOnce();
    expect(departTrip).toHaveBeenCalledWith('t1');
  });

  it('keeps the page with the reason the server gives', async () => {
    vi.setSystemTime(trip.departAt - 30 * MINUTE);
    const departTrip = vi.fn(async (): Promise<Trip> => {
      throw new ApiError(409, 'trips.too_early_to_depart');
    });
    open(trip, { departTrip });
    await openTrip();
    await tap('Yoʻlga chiqdim');
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText(/^Hali erta\. «Yoʻlga chiqdim»/u)).toBeTruthy();
    expect(screen.getByText('Joʻnashga 30 daqiqa')).toBeTruthy();
  });

  it('after «Yetib keldik» rates once and publishes the way back on the one screen', async () => {
    vi.setSystemTime(trip.departAt + 6 * 60 * MINUTE);
    const arriveTrip = vi.fn(async () => ({ ...left, arrivedAt: Date.now() }));
    const review = vi.fn<FeedbackClient['review']>(async () => undefined);
    const { tracked } = open(left, { arriveTrip }, review);
    await openTrip();
    await tap('Yetib keldik');
    expect(await screen.findByText('Yoʻlovchilarni baholang')).toBeTruthy();
    expect(arriveTrip).toHaveBeenCalledWith('t1');
    await tap('Yuborish');
    expect(review).toHaveBeenCalledWith({ bookingId: 'b2', stars: 5 });
    expect(await screen.findByText('Qaytishga yoʻlovchi olasizmi?')).toBeTruthy();
    await tap('Qaytishni eʼlon qilish');
    // The route the other way, the day after, the seats of the trip and a new comment.
    const publish = await screen.findByText(/^publish 1730401 1726269 2026-10-03 3 \[\]$/u);
    expect(tracked.some((event) => event.name === 'return_trip_created')).toBe(false);
    fireEvent.click(publish);
    expect(tracked.filter((event) => event.name === 'return_trip_created')).toHaveLength(1);
  });
});
