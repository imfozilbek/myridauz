import type { Trip } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { requestBoard } from './application/board';
import { publishRequest } from './application/use-cases';
import { HOME, setup } from './requests-test-kit';

const TRIP = {
  id: 'trip-1',
  from: '1726273',
  to: '1718401',
  departAt: Date.parse('2026-10-02T03:00:00Z'),
  seats: 4,
  seatsLeft: 3,
  price: 90_000,
  pickupMode: 'both',
  bookingRule: 'seats_or_car',
} as unknown as Trip;
// 300 m from the pickup of the request: «+0 km» is no detour; 5.7 km away: «+7 km».
const NEAR = { lat: 41.2883, lng: 69.2045 };
const FAR = { lat: 41.3396, lng: 69.2045 };

// «Yoʻlovchilar soʻrovlari» (G64, docs/118 path 7): the requests on the directions of the driver,
// the days with their counts, and with a trip of the driver the requests that fit it on top.
describe('the board of requests of a driver (G64)', () => {
  it('asks for a route while the driver has no direction yet', async () => {
    const { deps } = setup();
    const board = await requestBoard(deps, 9, {});
    expect(board.ok && board.value).toMatchObject({ known: false, others: [] });
  });

  it('counts the requests of today, tomorrow and the next day that has some, on the directions of the driver', async () => {
    const { deps, request, directions } = setup();
    directions([{ from: '1726', to: '1718' }]);
    await publishRequest(deps, 1, request);
    await publishRequest(deps, 2, { ...request, date: '2026-10-02' });
    await publishRequest(deps, 3, { ...request, date: '2026-10-02' });
    await publishRequest(deps, 4, { ...request, date: '2026-10-05' });
    // Another direction is not the driver's.
    await publishRequest(deps, 5, { ...request, from: '1718401', to: '1726273', date: '2026-10-02' });
    const board = await requestBoard(deps, 9, { date: '2026-10-02' });
    if (!board.ok) throw new Error(board.error);
    expect(board.value.days).toEqual([
      { date: '2026-10-01', count: 1 },
      { date: '2026-10-02', count: 2 },
      { date: '2026-10-05', count: 1 },
    ]);
    expect(board.value.others.map((item) => item.passenger.firstName)).toEqual(['P2', 'P3']);
  });

  it('puts the requests that fit the trip of the driver on top with their extra km, the others below', async () => {
    const { deps, request, directions, boardTrip } = setup();
    directions([{ from: '1726', to: '1718' }]);
    boardTrip({ trip: TRIP, stops: { pickups: [NEAR], dropoffs: [] } });
    const day = { ...request, date: '2026-10-02' };
    await publishRequest(deps, 1, { ...day, pickup: FAR });
    await publishRequest(deps, 2, { ...day, pickup: HOME });
    await publishRequest(deps, 3, { ...day, seats: 4 });
    await publishRequest(deps, 4, { ...day, seats: 2, wholeCar: true });
    const board = await requestBoard(deps, 9, { date: '2026-10-01' });
    if (!board.ok) throw new Error(board.error);
    expect(board.value.date).toBe('2026-10-02');
    expect(board.value.trip?.id).toBe('trip-1');
    expect(board.value.fits.map((item) => [item.passenger.firstName, item.extraKm])).toEqual([
      ['P2', 0],
      ['P1', 7],
    ]);
    expect(board.value.others.map((item) => item.passenger.firstName)).toEqual(['P3', 'P4']);
  });

  it('shows one route asked by a bot link without the trip', async () => {
    const { deps, request, boardTrip } = setup();
    boardTrip({ trip: TRIP, stops: { pickups: [], dropoffs: [] } });
    await publishRequest(deps, 1, request);
    const board = await requestBoard(deps, 9, { from: '1726', to: '1718', date: '2026-10-01' });
    expect(board.ok && [board.value.known, board.value.trip, board.value.others.length]).toEqual([
      true,
      null,
      1,
    ]);
  });
});
