import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import type { NotificationJob } from '../notifications';
import { sendOffer } from './application/offers';
import { telegramNotifier } from './infrastructure/telegram-notifier';
import { DILNOZA, DRIVER, HOUR, NOW, setup } from './test-kit';

// «Yangi taklif» (G61, journey screen 4): who, which car, when, the share of a seat, the route.
describe('the bot message of a new offer', () => {
  it('names the driver, the car, the time, the price and the route of the request', async () => {
    const { deps: kit, addRequest, bonus } = setup();
    const jobs: NotificationJob[] = [];
    const deps = {
      ...kit,
      notify: {
        ...kit.notify,
        offered: telegramNotifier({
          brand: loadBrand(),
          notify: async (sent) => void jobs.push(...sent),
          system: async () => undefined,
          placeName: async (id) => (id === '1726273' ? 'Chilonzor' : 'Samarqand'),
          closeOnes: async () => undefined,
          telegramId: async () => 42,
          passenger: async () => undefined,
        }).offered,
      },
    };
    await bonus();
    await sendOffer(deps, DRIVER, addRequest(), { departAt: NOW + 26 * HOUR, price: 100_000 });
    const [job] = jobs;
    expect(job?.chatId).toBe(DILNOZA);
    expect(job?.text).toContain('Jasur');
    expect(job?.text).toContain('Cobalt');
    expect(job?.text).toMatch(/100\s000/u);
    expect(job?.text).toContain('Chilonzor → Samarqand');
  });
});
