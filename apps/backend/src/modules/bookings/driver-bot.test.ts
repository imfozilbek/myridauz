import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import type { NotificationJob } from '../notifications';
import { requestBooking } from './application/request';
import { telegramNotifier } from './infrastructure/telegram-notifier';
import { DILNOZA, seats, setup } from './test-kit';

const DRIVER_CHAT = 7;
const PASSENGER_CHAT = 9;

// The driver knows the deadline of a request and hears when it burned (docs/89 D1, S11).
describe('the driver bot about a request', () => {
  it('says until when to answer, and tells the driver about a request that burned', async () => {
    const { deps, addTrip } = setup();
    const asked = await requestBooking(deps, DILNOZA, addTrip(), seats(1));
    if (!asked.ok) throw new Error(asked.error);
    const booking = asked.value;
    const jobs: NotificationJob[] = [];
    const notifier = telegramNotifier({
      brand: loadBrand(),
      notify: async (sent) => void jobs.push(...sent),
      system: async () => undefined,
      placeName: async (id) => id,
      closeOnes: async () => undefined,
      telegramId: async (id) => (id === booking.trip.driver.id ? DRIVER_CHAT : PASSENGER_CHAT),
      passenger: async () => undefined,
    });
    await notifier.requested(booking);
    expect(jobs[0]?.chatId).toBe(DRIVER_CHAT);
    expect(jobs[0]?.text).toMatch(/Javob berish muddati: .+, soat \d\d:\d\d\./u);
    await notifier.expired(booking);
    const toDriver = jobs.slice(1).filter((job) => job.chatId === DRIVER_CHAT);
    expect(toDriver).toHaveLength(1);
    expect(toDriver[0]?.text).toContain('soʻroviga oʻz vaqtida javob berilmadi');
    expect(toDriver[0]?.text).toContain(booking.passenger.firstName);
  });
});
