import { loadBrand } from '@platform/brands';
import type { NotificationJob } from '../../notifications';
import type { Trip } from '@platform/contracts';
import { describe, expect, it, vi } from 'vitest';
import { favoriteTeller } from './bot-teller';

const trip = {
  id: 't1',
  from: '1726',
  to: '1730',
  departAt: 0,
  seatsLeft: 2,
  price: 90_000,
  driver: { firstName: 'Jasur' },
} as Trip;

describe('news of a saved driver (docs/125 №11)', () => {
  it('go to every passenger who saved the driver', async () => {
    const send = vi.fn<(jobs: readonly NotificationJob[]) => Promise<void>>(async () => undefined);
    const tell = favoriteTeller({
      brand: loadBrand(),
      placeName: async (id) => id,
      send,
    });
    await tell([10, 11], trip);
    expect(send.mock.calls[0]?.[0].map((job) => job.chatId)).toEqual([10, 11]);
  });
});
