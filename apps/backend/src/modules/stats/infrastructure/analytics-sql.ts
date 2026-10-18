import type { Fetch } from '../../../shared/telegram/telegram-api';
import { ERROR_EVENTS, type EventSource } from '../application/ports';
import {
  botRow,
  counterRow,
  errorRow,
  markRow,
  peakRow,
  searchRow,
  sqlAnswerSchema,
  toCounter,
  toErrorRow,
  totalRow,
} from './sql-rows';

// Columns of a row (modules/analytics/domain/data-point.ts): blob1 name, blob2 app, blob3 screen,
// blob5 session, blob6 code, blob7 and blob8 the class and the words of a crash (G52). _sample_interval makes counts right when Cloudflare samples.
type Options = {
  readonly accountId: string;
  readonly token: string;
  readonly dataset: string;
  readonly fetch: Fetch;
};
const TOP_ERRORS = 15;
// The marks of the first screens and the directions of «Rost»: enough rows for every author code.
const TOP_MARKS = 2000;
const list = (names: readonly string[]) => names.map((name) => `'${name}'`).join(', ');
const within = (unit: 'DAY' | 'HOUR', amount: number) =>
  `timestamp > NOW() - INTERVAL '${Math.trunc(amount)}' ${unit}`;

export function analyticsSql({ accountId, token, dataset, fetch }: Options): EventSource {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`;
  async function query(sql: string): Promise<unknown> {
    const init = {
      method: 'POST',
      body: `${sql} FORMAT JSON`,
      headers: { authorization: `Bearer ${token}` },
    };
    const response = await fetch(url, init);
    if (!response.ok) throw new Error(`stats.sql_${response.status}`);
    return response.json();
  }
  return {
    counters: async (days, names) => {
      const sql =
        `SELECT blob1 AS name, blob2 AS app, blob6 AS code, count(DISTINCT blob5) AS sessions, ` +
        `SUM(_sample_interval) AS events FROM ${dataset} WHERE ${within('DAY', days)} ` +
        `AND blob1 IN (${list(names)}) GROUP BY name, app, code`;
      return sqlAnswerSchema(counterRow)
        .parse(await query(sql))
        .data.map(toCounter);
    },
    topErrors: async (days) => {
      const sql =
        `SELECT blob1 AS name, blob2 AS app, blob3 AS screen, blob6 AS code, blob7 AS error, ` +
        `blob8 AS detail, SUM(_sample_interval) AS count FROM ${dataset} WHERE ${within('DAY', days)} ` +
        `AND blob1 IN (${list(ERROR_EVENTS)}) GROUP BY name, app, screen, code, error, detail ` +
        `ORDER BY count DESC LIMIT ${TOP_ERRORS}`;
      return sqlAnswerSchema(errorRow)
        .parse(await query(sql))
        .data.map(toErrorRow);
    },
    errorsSince: async (hours) => {
      const sql =
        `SELECT SUM(_sample_interval) AS count FROM ${dataset} ` +
        `WHERE ${within('HOUR', hours)} AND blob1 IN (${list(ERROR_EVENTS)})`;
      return sqlAnswerSchema(totalRow).parse(await query(sql)).data[0]?.count ?? 0;
    },
    // blob11: the mark of the first screen of a session (G55); one session counts once.
    marks: async (days) => {
      const sql =
        `SELECT blob11 AS via, count(DISTINCT blob5) AS count FROM ${dataset} WHERE ${within('DAY', days)} ` +
        `AND blob1 = 'screen_open' AND blob11 != '' GROUP BY via ORDER BY count DESC LIMIT ${TOP_MARKS}`;
      return sqlAnswerSchema(markRow).parse(await query(sql)).data;
    },
    // blob6: found or empty, blob7: the two regions of the search (G69).
    searches: async (days) => {
      const sql =
        `SELECT blob7 AS route, blob6 AS result, SUM(_sample_interval) AS count FROM ${dataset} ` +
        `WHERE ${within('DAY', days)} AND blob1 = 'trip_search' AND blob7 != '' GROUP BY route, result ` +
        `ORDER BY count DESC LIMIT ${TOP_MARKS}`;
      return sqlAnswerSchema(searchRow).parse(await query(sql)).data;
    },
    // G85 T1: what Telegram answered each bot, its dead letters, the operations of the queue (double3),
    // and the busiest second of each bot.
    bots: async (days) => {
      const rows =
        `SELECT blob1 AS name, blob2 AS bot, blob6 AS code, SUM(_sample_interval) AS count, ` +
        `SUM(double3 * _sample_interval) AS amount FROM ${dataset} WHERE ${within('DAY', days)} AND ` +
        `(blob1 IN ('bot_send', 'queue_ops', 'bot_member') OR (blob1 = 'server_error' AND blob6 = 'notification_dead')) ` +
        `GROUP BY name, bot, code`;
      // The busiest second of each bot: the seconds of every bot first, then the most of each one.
      const peaks =
        `SELECT bot, max(count) AS count FROM (SELECT blob2 AS bot, ` +
        `toStartOfInterval(timestamp, INTERVAL '1' SECOND) AS second, SUM(_sample_interval) AS count ` +
        `FROM ${dataset} WHERE ${within('DAY', days)} AND blob1 = 'bot_send' AND blob6 = 'sent' ` +
        `GROUP BY bot, second) GROUP BY bot`;
      const [found, busiest] = await Promise.all([query(rows), query(peaks)]);
      return {
        rows: sqlAnswerSchema(botRow).parse(found).data,
        peaks: sqlAnswerSchema(peakRow).parse(busiest).data,
      };
    },
  };
}
