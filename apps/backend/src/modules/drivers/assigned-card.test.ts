import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import type { QueueNews } from '../team-queue';
import { emptyApplication } from './domain/application';
import { telegramNotifier } from './infrastructure/telegram-notifier';

// A new application is a case of «Navbat» and gets its member for the reminders (docs/92); the
// decision is taken in the admin app and the case leaves «Navbat» (G68, docs/122).
describe('a new application and the queue of the team', () => {
  it('assigns its member, rings «Navbat» as new, and refreshes it after the decision', async () => {
    const told: string[] = [];
    const notifier = telegramNotifier({
      brand: loadBrand(),
      show: async () => undefined,
      assign: async (userId) => void told.push(`assign ${userId}`),
      queue: async (news?: QueueNews) => void told.push(`queue ${news?.kind ?? 'refresh'}`),
    });
    const application = { ...emptyApplication(31, 0), status: 'pending' as const };
    await notifier.submitted(application);
    await notifier.decided({ ...application, status: 'approved' }, null, null);
    expect(told).toEqual(['assign 31', 'queue new', 'queue refresh']);
  });
});
