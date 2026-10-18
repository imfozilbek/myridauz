import { describe, expect, it } from 'vitest';
import { serverDataPoint } from '../analytics/domain/data-point';
import { botLoadOf } from './domain/bot-load';
import { memoryEvents } from './infrastructure/memory-events';

const NOW = Date.parse('2026-10-18T10:00:00Z');
const at = (seconds: number) => NOW - seconds * 1000;
const send = (bot: string, code: string, second: number) =>
  serverDataPoint({ name: 'bot_send', source: bot, code }, at(second));

// G85 T1 (docs/122): the dashboard shows each bot under load and the operations of the queue a day.
describe('the bots under load', () => {
  it('counts what Telegram took, its 429 answers, the dead letters and the busiest second', async () => {
    const rows = [
      send('passenger', 'sent', 10),
      send('passenger', 'sent', 10),
      send('passenger', 'sent', 10),
      send('passenger', 'sent', 40),
      send('passenger', 'limited', 40),
      send('poster', 'sent', 50),
      serverDataPoint({ name: 'server_error', source: 'poster', code: 'notification_dead' }, at(60)),
      serverDataPoint({ name: 'queue_ops', source: 'write', count: 30 }, at(70)),
      serverDataPoint({ name: 'queue_ops', source: 'read', count: 40 }, at(70)),
      // Older than the period: not counted.
      send('driver', 'sent', 3 * 24 * 3600),
    ];
    const events = await memoryEvents(rows, () => NOW).bots(2);
    expect(botLoadOf(events, 2)).toEqual({
      bots: [
        { bot: 'passenger', sent: 4, limited: 1, dead: 0, peak: 3 },
        { bot: 'poster', sent: 1, limited: 0, dead: 1, peak: 1 },
      ],
      queueOps: 35,
    });
  });

  it('shows nothing for quiet bots', () => {
    expect(botLoadOf({ rows: [], peaks: [] }, 1)).toEqual({ bots: [], queueOps: 0 });
  });
});
