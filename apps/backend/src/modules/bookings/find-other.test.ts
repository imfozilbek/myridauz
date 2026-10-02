import { loadBrand } from '@platform/brands';
import { tashkentDate } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import type { NotificationJob } from '../notifications';
import { requestBooking } from './application/request';
import { telegramNotifier } from './infrastructure/telegram-notifier';
import { DILNOZA, seats, setup } from './test-kit';

// A refused, burned or cancelled seat leads to the trips of the same route and day (docs/89 S10).
describe('«Boshqa safar topish» under a booking that ended', () => {
  it('opens the search of the route and the day, not the dead booking', async () => {
    const { deps, addTrip } = setup();
    const asked = await requestBooking(deps, DILNOZA, addTrip(), seats(1));
    if (!asked.ok) throw new Error(asked.error);
    const jobs: NotificationJob[] = [];
    const notifier = telegramNotifier({
      brand: loadBrand(),
      notify: async (sent) => void jobs.push(...sent),
      system: async () => undefined,
      placeName: async (id) => id,
      closeOnes: async () => undefined,
      telegramId: async () => 42,
    });
    const { trip } = asked.value;
    const find = `?find=${trip.from}_${trip.to}_${tashkentDate(trip.departAt)}`;
    for (const tell of [notifier.declined, notifier.expired]) await tell(asked.value);
    await notifier.cancelled(asked.value, 'driver');
    const urls = jobs.filter((job) => job.bot === 'passenger').map((job) => JSON.stringify(job.markup));
    expect(urls).toHaveLength(3);
    expect(urls.every((url) => url.includes(find) && url.includes('Boshqa safar topish'))).toBe(true);
  });
});
