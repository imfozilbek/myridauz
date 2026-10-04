import type { Fetch } from '../../../shared/telegram/telegram-api';
import { ERROR_EVENTS, type EventSource } from '../application/ports';
import { counterRow, errorRow, sqlAnswerSchema, toCounter, toErrorRow, totalRow } from './sql-rows';

// Columns of a row (modules/analytics/domain/data-point.ts): blob1 name, blob2 app, blob3 screen,
// blob5 session, blob6 code, blob7 and blob8 the class and the words of a crash (G52). _sample_interval makes counts right when Cloudflare samples.
type Options = {
  readonly accountId: string;
  readonly token: string;
  readonly dataset: string;
  readonly fetch: Fetch;
};
const TOP_ERRORS = 15;
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
  };
}
