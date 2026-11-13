import { z } from 'zod';
import { NETWORK_CODES, type EventSource } from '../application/ports';
import { PATH_EVENTS } from '../domain/path-events';
import { sqlAnswerSchema } from './sql-rows';

// G99 (docs/234): blob12 who, blob13 the first touch, blob14 the version of Telegram, blob15 the
// platform. Each person and step once, with its first moment (double1).
const text = z.string();
const number = z.coerce.number().nonnegative();
const eventRow = z.object({
  who: text,
  entry: text,
  tg: text,
  platform: text,
  name: text,
  app: text,
  code: text,
  at: number,
});
const errorRow = z.object({ entry: text, tg: text, platform: text, count: number });
// Enough rows for every person and step of 90 days at the size of Rida now (docs/117).
const MAX_ROWS = 20_000;
const list = (names: readonly string[]) => names.map((name) => `'${name}'`).join(', ');
const within = (days: number) => `timestamp > NOW() - INTERVAL '${Math.trunc(days)}' DAY`;

type Query = (sql: string) => Promise<unknown>;
export const analyticsPaths = (
  query: Query,
  dataset: string,
): Pick<EventSource, 'pathEvents' | 'pathErrors'> => ({
  pathEvents: async (days) => {
    const sql =
      `SELECT blob12 AS who, blob13 AS entry, blob14 AS tg, blob15 AS platform, blob1 AS name, ` +
      `blob2 AS app, blob6 AS code, min(double1) AS at FROM ${dataset} WHERE ${within(days)} ` +
      `AND blob1 IN (${list(PATH_EVENTS)}) AND blob12 != '' ` +
      `GROUP BY who, entry, tg, platform, name, app, code LIMIT ${MAX_ROWS}`;
    return sqlAnswerSchema(eventRow).parse(await query(sql)).data;
  },
  pathErrors: async (days) => {
    const network = NETWORK_CODES.map((code) => `blob6 != '${code}'`).join(' AND ');
    const sql =
      `SELECT blob13 AS entry, blob14 AS tg, blob15 AS platform, SUM(_sample_interval) AS count ` +
      `FROM ${dataset} WHERE ${within(days)} AND blob1 IN ('client_error', 'api_error') AND ${network} ` +
      `GROUP BY entry, tg, platform`;
    return sqlAnswerSchema(errorRow)
      .parse(await query(sql))
      .data.map((row) => ({
        entry: row.entry || null,
        tg: row.tg || null,
        platform: row.platform || null,
        count: row.count,
      }));
  },
});
