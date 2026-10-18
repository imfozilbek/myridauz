import { MESSAGE_BOTS, type BotLoad } from '@platform/contracts';

// One group of the events of the bots (G85 T1): bot_send by its outcome, queue_ops with the count of
// operations it stands for, server_error notification_dead by its bot.
export type BotRow = {
  readonly name: string;
  readonly bot: string;
  readonly code: string;
  readonly count: number;
  readonly amount: number;
};
// The messages of a bot in one second.
type PeakRow = { readonly bot: string; readonly count: number };
export type BotEvents = { readonly rows: readonly BotRow[]; readonly peaks: readonly PeakRow[] };

const sum = (rows: readonly BotRow[], match: (row: BotRow) => boolean, of: (row: BotRow) => number) =>
  rows.filter(match).reduce((total, row) => total + of(row), 0);

// What each bot did in the period, the bots that did nothing left out, and the operations of the
// queue a day (docs/122).
export function botLoadOf({ rows, peaks }: BotEvents, days: number): { bots: BotLoad[]; queueOps: number } {
  const bots = MESSAGE_BOTS.map((bot) => {
    const sent = (code: string) =>
      sum(
        rows,
        (row) => row.name === 'bot_send' && row.bot === bot && row.code === code,
        (row) => row.count,
      );
    return {
      bot,
      sent: sent('sent'),
      limited: sent('limited'),
      dead: sum(
        rows,
        (row) => row.name === 'server_error' && row.bot === bot,
        (row) => row.count,
      ),
      peak: Math.max(0, ...peaks.filter((peak) => peak.bot === bot).map((peak) => peak.count)),
    };
  }).filter((load) => load.sent + load.limited + load.dead > 0);
  const operations = sum(
    rows,
    (row) => row.name === 'queue_ops',
    (row) => row.amount,
  );
  return { bots, queueOps: Math.round(operations / days) };
}
