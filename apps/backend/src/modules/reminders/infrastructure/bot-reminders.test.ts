import { loadBrand } from '@platform/brands';
import type { Trip } from '@platform/contracts';
import { describe, expect, it, vi } from 'vitest';
import { botReminders } from './bot-reminders';

const trip = (driverId: string) =>
  ({ id: 't1', from: '1726', to: '1730', departAt: 0, driver: { id: driverId } }) as Trip;

describe('reminders (docs/125 №11)', () => {
  it('go to everyone: «Bot xabarlari» are always on', async () => {
    const send = vi.fn(async () => undefined);
    const tell = botReminders({
      brand: loadBrand(),
      placeName: async (id) => id,
      send,
      telegramId: async (publicId) => Number(publicId),
    });
    await tell(trip('10'), 2, 'day');
    expect(send).toHaveBeenCalledOnce();
  });
});
