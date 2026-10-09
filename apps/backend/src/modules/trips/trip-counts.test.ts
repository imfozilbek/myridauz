import { describe, expect, it } from 'vitest';
import { publishTrip } from './application/publish';
import { tripDetail } from './application/read';
import { directionCards, tripDays } from './application/trip-counts';
import { HOUR, NOW, setup } from './test-kit';

const TOMORROW = NOW + 24 * HOUR;

async function market() {
  const kit = setup();
  const today = await publishTrip(kit.deps, 1, kit.trip);
  await publishTrip(kit.deps, 2, { ...kit.trip, departAt: TOMORROW + 3 * HOUR, price: 80000 });
  return { ...kit, todayId: today.ok ? today.value.id : '' };
}

describe('the trips of each direction (G59, docs/118)', () => {
  it('a card per busy direction: today, tomorrow and the cheapest seat', async () => {
    const { deps } = await market();
    const [samarqand] = await directionCards(deps, '1726273');
    expect(samarqand).toEqual({ to: '1718', today: 1, tomorrow: 1, price: 80000 });
  });

  it('the popular regions fill the cards with the recommended price', async () => {
    const { deps } = await market();
    expect((await directionCards(deps, '1726273'))[1]).toEqual({
      to: '1706',
      today: 0,
      tomorrow: 0,
      price: 90000,
    });
  });

  it('own trips and full trips are not counted, as in the search', async () => {
    const { deps, ride, todayId } = await market();
    expect((await directionCards(deps, '1726273', 2))[0]).toMatchObject({ today: 1, tomorrow: 0 });
    ride({ tripId: todayId, passengerId: 3, seats: 3, withWoman: false, pickup: null, dropoff: null });
    expect((await directionCards(deps, '1726273'))[0]).toMatchObject({ today: 0, tomorrow: 1 });
  });

  it('«Safarlar»: the trips of each day of a week and the km', async () => {
    const { deps } = await market();
    const days = await tripDays(deps, '1726', '1718');
    expect(days.ok && days.value.km).toBe(300);
    expect(days.ok && days.value.days.map((day) => day.trips)).toEqual([1, 1, 0, 0, 0, 0, 0]);
    expect(days.ok && days.value.days[0]?.date).toBe('2026-10-01');
  });

  it('a route inside one city has no days', async () => {
    const { deps } = await market();
    expect(await tripDays(deps, '1726273', '1726294')).toEqual({ ok: false, error: 'locations.inside_city' });
  });
});

describe('«Men bilan ayol bor» (docs/06 rule 4)', () => {
  it('a confirmed man with it gives the trip the woman mark', async () => {
    const { deps, ride, todayId } = await market();
    ride({ tripId: todayId, passengerId: 3, seats: 2, withWoman: true, pickup: null, dropoff: null });
    expect(await tripDetail(deps, todayId, 0)).toMatchObject({ woman: true, seatsLeft: 1 });
  });
});
