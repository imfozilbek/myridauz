import { describe, expect, it } from 'vitest';
import type { Counter } from './counters';
import { helpOf } from './help';

const row = (name: string, app: string, code: string, events: number): Counter => ({
  name,
  app,
  code,
  sessions: events,
  events,
});

// G97 (docs/226): the questions of the help from the Mini Apps and the bots, and «Boshqa savolim bor».
describe('helpOf', () => {
  it('adds the Mini Apps and the bots by question, the most opened first; topics are not counted', () => {
    expect(
      helpOf([
        row('help_open', 'passenger', 'booking.wait', 5),
        row('help_open', 'support', 'booking.wait', 3),
        row('help_open', 'driver', 'wallet.top_up', 12),
        row('help_more', 'driver', 'wallet.top_up', 4),
        row('help_open', 'passenger', 'booking', 40),
        row('help_more', 'support', '', 7),
        row('screen_open', 'passenger', 'booking.wait', 99),
      ]),
    ).toEqual([
      { code: 'wallet.top_up', opened: 12, more: 4 },
      { code: 'booking.wait', opened: 8, more: 0 },
    ]);
  });
});
