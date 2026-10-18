import { describe, expect, it } from 'vitest';
import type { NotificationJob } from './application/job';
import { coalesce, isChannel, massDelays, MASS_PER_SECOND, secondsUntil } from './application/pace';

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
  it('lets each bot send MASS_PER_SECOND of a big batch a second', () => {
    const jobs = Array.from({ length: MASS_PER_SECOND * 2 + 1 }, (_, chatId) => to(chatId + 1, 'x'));
    const delays = massDelays([...jobs, { ...to(1, 'y'), bot: 'driver' }]);
    expect(delays.slice(0, MASS_PER_SECOND)).toEqual(Array(MASS_PER_SECOND).fill(0));
    expect(delays.slice(MASS_PER_SECOND, MASS_PER_SECOND * 2)).toEqual(Array(MASS_PER_SECOND).fill(1));
    // The last of the passenger bot waits 2 seconds; the driver bot starts at once.
    expect(delays.slice(-2)).toEqual([2, 0]);
  });

  it('knows a channel from a person and counts whole seconds', () => {
    expect([isChannel('@channel'), isChannel(-100123), isChannel(5)]).toEqual([true, true, false]);
    expect([secondsUntil(1001, 0), secondsUntil(0, 5000)]).toEqual([2, 0]);
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
