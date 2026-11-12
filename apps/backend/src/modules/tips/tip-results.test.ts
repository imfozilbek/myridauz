import { describe, expect, it } from 'vitest';
import { fullScans } from '../../test-d1';
import { tipResults } from './index';
import { ago, booking, DAY, HOUR, iso, NOON, people, tipsDb, trip } from './tips-test-kit';
import type { Bindings } from '../../env';
import { testEnv } from '../../test-api';

const tip = (user: number, step: string, at: number) => `(${user}, '${step}', ${at})`;
// The tips of 10 days ago, and what each person did after: within 72 h or later.
const SENT = ago(10 * DAY);
const SEED = `${people(1, 2, 3, 4, 5, 6)}
  INSERT INTO tips (user_id, step, sent_at) VALUES ${[
    tip(1, 'p2', SENT),
    tip(2, 'p2', SENT),
    tip(3, 'p3', SENT),
    tip(4, 'd1', SENT),
    tip(5, 'd2', SENT),
    tip(6, 'd2', SENT),
    tip(6, 'd4', ago(40 * DAY)),
  ].join(', ')};
  INSERT INTO trip_views (trip_id, user_id, first_at) VALUES ('x', '1', '${iso(SENT + HOUR)}');
  ${trip('t', 9, NOON, NOON)} ${booking('b3', 't', 3, 'confirmed', SENT + 4 * DAY)}
  INSERT INTO driver_applications (user_id, status, submitted_at, updated_at) VALUES (4, 'pending', ${SENT + DAY}, 0);
  ${trip('t5', 5, NOON, NOON)} UPDATE trips SET created_at = ${SENT + 2 * HOUR} WHERE id = 't5';`;

// «Rost» (G70a, docs/232): the tips of each step and how many people did the step within 72 h.
describe('the results of the tips', () => {
  it('counts the tips of the period and the steps done within 72 h, by the tables of D1', async () => {
    const db = await tipsDb(SEED);
    const env = { ...testEnv, DB: db } as unknown as Bindings;
    const rows = await tipResults(env, ago(30 * DAY));
    expect(rows.sort((a, b) => a.step.localeCompare(b.step))).toEqual([
      { step: 'd1', sent: 1, done: 1 },
      { step: 'd2', sent: 2, done: 1 },
      { step: 'p2', sent: 2, done: 1 },
      { step: 'p3', sent: 1, done: 0 },
    ]);
    expect(fullScans(db)).toEqual([]);
    expect(await tipResults(testEnv as unknown as Bindings, 0)).toEqual([]);
  });
});
