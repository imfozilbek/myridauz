import { loadBrand } from '@platform/brands';
import { describe, expect, it, vi } from 'vitest';
import type { SubscriptionRecord } from '../domain/subscription';
import { botTeller } from './bot-teller';

const subscription: SubscriptionRecord = {
  id: 's1',
  userId: 10,
  kind: 'trips',
  from: '1726',
  to: '1730',
  date: null,
  woman: false,
  expiresAt: 0,
  expired: false,
  lastSentAt: null,
  pending: 0,
  createdAt: 0,
};

describe('subscription news (docs/125 №11)', () => {
  it('go to every subscriber: «Bot xabarlari» are always on', async () => {
    const send = vi.fn(async () => undefined);
    const tell = botTeller({ brand: loadBrand(), placeName: async (id) => id, send });
    await tell.many(subscription, 2);
    await tell.renew(subscription);
    expect(send).toHaveBeenCalledTimes(2);
  });
});
