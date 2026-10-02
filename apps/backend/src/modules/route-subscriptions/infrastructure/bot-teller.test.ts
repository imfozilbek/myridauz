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

describe('subscription news only to who wants them (docs/88 L1)', () => {
  it('stays quiet when «Bot xabarlari» is off', async () => {
    const send = vi.fn(async () => undefined);
    const wantsNews = vi.fn(async (id: number) => id !== 10);
    const tell = botTeller({ brand: loadBrand(), placeName: async (id) => id, send, wantsNews });
    await tell.many(subscription, 2);
    await tell.renew(subscription);
    expect(send).not.toHaveBeenCalled();
    await tell.many({ ...subscription, userId: 11 }, 2);
    expect(send).toHaveBeenCalledOnce();
  });
});
