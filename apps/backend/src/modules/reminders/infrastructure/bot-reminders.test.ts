import { loadBrand } from '@platform/brands';
import type { Trip } from '@platform/contracts';
import { describe, expect, it, vi } from 'vitest';
import { botReminders } from './bot-reminders';

const trip = (driverId: string) =>
  ({ id: 't1', from: '1726', to: '1730', departAt: 0, driver: { id: driverId } }) as Trip;

describe('reminders only to who wants them (docs/88 L1)', () => {
  it('stays quiet when «Bot xabarlari» is off', async () => {
    const send = vi.fn(async () => undefined);
    const tell = botReminders({
      brand: loadBrand(),
      placeName: async (id) => id,
      send,
      telegramId: async (publicId) => Number(publicId),
      wantsNews: async (id) => id !== 10,
    });
    await tell.driver(trip('10'), 2, 'day');
    expect(send).not.toHaveBeenCalled();
    await tell.driver(trip('11'), 2, 'day');
    expect(send).toHaveBeenCalledOnce();
  });
});
