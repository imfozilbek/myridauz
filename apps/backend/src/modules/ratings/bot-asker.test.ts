import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import type { NotificationJob } from '../notifications';
import { botAsker } from './infrastructure/bot-asker';

const ASK = { bookingId: 'b1', raterId: 5, rateeId: 6, askedAt: 0 };

// «Safar qanday oʻtdi?» answers the trip card of the rater's bot (G68, docs/122 rule 1).
describe('the ask of the stars', () => {
  it('answers the trip card: the seat of the passenger, the trip of the driver', async () => {
    const jobs: NotificationJob[] = [];
    const ask = botAsker(loadBrand(), async (sent) => void jobs.push(...sent));
    await ask(ASK, 'Jasur', { rater: 'passenger', tripId: 't1' }, false);
    await ask(ASK, 'Madina', { rater: 'driver', tripId: 't1' }, false);
    expect(jobs.map((job) => [job.bot, job.replyCard])).toEqual([
      ['passenger', 'trip:b1'],
      ['driver', 'trip:t1'],
    ]);
  });
});
