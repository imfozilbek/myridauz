import type { AnalyticsEvent } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { toDataPoint } from '../analytics/domain/data-point';
import { entriesOf } from './domain/entries';
import { memoryEvents } from './infrastructure/memory-events';

const NOW = Date.parse('2026-10-18T10:00:00Z');
type Arrival = { readonly source?: string; readonly via?: string };
const session = (index: number) => `6f1c2f7e-0000-4000-8000-${String(index).padStart(12, '0')}`;
const opened = (index: number, arrival: Arrival, screen = 'home'): AnalyticsEvent => ({
  name: 'screen_open',
  app: 'passenger',
  screen,
  at: NOW - 60_000,
  sessionId: session(index),
  version: '1',
  ...arrival,
});

// G87 V4 (docs/116): «Statistika» tells a tap on a bot message from a direct visit and a link.
describe('how the sessions began', () => {
  it('counts each session once by its first screen', async () => {
    const events = [
      opened(1, { source: 'direct', via: 'bot-booking' }),
      opened(2, { source: 'direct', via: 'bot-chat' }),
      opened(3, { source: 'direct' }),
      opened(4, { source: 'trip', via: 'ch-yol-samarqand' }),
      opened(5, { source: 'direct', via: 'ad-insta1' }),
      opened(6, { source: 'find' }),
      // The next screens of a session say nothing of its way in.
      opened(1, {}, 'booking'),
      opened(3, {}, 'search'),
    ];
    const source = memoryEvents(
      events.map((event) => toDataPoint(event, NOW - 60_000)),
      () => NOW,
    );
    expect(entriesOf(await source.entries(1))).toEqual({ bot: 2, direct: 1, link: 3 });
    // The marks of bot messages are no source of people for «Rost».
    expect(await source.marks(1)).toEqual([
      { via: 'ch-yol-samarqand', count: 1 },
      { via: 'ad-insta1', count: 1 },
    ]);
  });

  it('shows zeros without sessions and leaves an odd row out', () => {
    expect(entriesOf([])).toEqual({ bot: 0, direct: 0, link: 0 });
    expect(entriesOf([{ entry: 'other', count: 4 }])).toEqual({ bot: 0, direct: 0, link: 0 });
  });
});
