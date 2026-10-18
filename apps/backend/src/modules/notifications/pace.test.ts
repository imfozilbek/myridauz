import { describe, expect, it } from 'vitest';
import type { NotificationJob } from './application/job';
import { coalesce, isChannel, MASS_PER_SECOND, paceAfter, secondsUntil } from './application/pace';

const to = (chatId: number | string, text: string, more: Partial<NotificationJob> = {}): NotificationJob => ({
  bot: 'passenger',
  chatId,
  text,
  ...more,
});
const card = (key: string, text: string, edit?: number) =>
  to(5, text, { after: { type: 'card', key, hash: text }, ...(edit ? { edit } : {}) });

// G85 part 2 (docs/122): many messages go at an even pace; events of one person at once are one message.
describe('the pace of the bots', () => {
  // The clock of a bot also paces a loop that tells people one by one (the reviewer of G85).
  it('lets each bot send MASS_PER_SECOND mass messages a second, call after call', () => {
    const clock = new Map();
    const waits = Array.from({ length: MASS_PER_SECOND * 2 + 1 }, () => paceAfter(clock, 'passenger', 0));
    expect(waits.slice(0, MASS_PER_SECOND)).toEqual(Array(MASS_PER_SECOND).fill(0));
    expect(waits.slice(MASS_PER_SECOND, MASS_PER_SECOND * 2)).toEqual(Array(MASS_PER_SECOND).fill(1));
    // The last of the passenger bot waits 2 seconds; the driver bot starts at once.
    expect([waits.at(-1), paceAfter(clock, 'driver', 0)]).toEqual([2, 0]);
    // A quiet bot starts again from now.
    expect(paceAfter(clock, 'passenger', 60_000)).toBe(0);
  });

  it('knows a channel from a person and counts whole seconds', () => {
    expect([isChannel('@channel'), isChannel(-100123), isChannel(5)]).toEqual([true, true, false]);
    expect([secondsUntil(1001, 0), secondsUntil(0, 5000)]).toEqual([2, 0]);
    // The queue holds a message 12 hours at most.
    expect(secondsUntil(100 * 3_600_000, 0)).toBe(43_200);
  });

  it('keeps the last state of a live card and joins plain texts to one person', () => {
    const joined = coalesce([
      card('trip', 'old', 9),
      to(5, 'Bron tasdiqlandi'),
      card('trip', 'new', 9),
      to(5, 'Haydovchi yozdi', { silent: true }),
      to(6, 'Boshqa odam'),
    ]);
    expect(joined).toEqual([
      card('trip', 'new', 9),
      { ...to(5, 'Bron tasdiqlandi\n\nHaydovchi yozdi'), silent: false },
      to(6, 'Boshqa odam'),
    ]);
  });

  it('never joins messages with buttons, rings of a card, channel posts or other bots', () => {
    const jobs = [
      to(5, 'a', { markup: { inline_keyboard: [] } }),
      to(5, 'b', { replyCard: 'trip' }),
      to(5, 'c', { bot: 'driver' }),
      to(5, 'd'),
      to('@ch', 'e'),
      to('@ch', 'f'),
      to(5, 'g', { html: true }),
    ];
    expect(coalesce(jobs)).toEqual(jobs);
  });
});
