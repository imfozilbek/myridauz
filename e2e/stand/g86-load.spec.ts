import { expect, test } from '../crash-guard';
import { STAND_TELEGRAM_PORT } from '../../scripts/stand/paths.ts';
import { SAMARQAND, TO_SAMARQAND } from './g27-kit';
import { book, CHILONZOR, publishTrip } from './market-kit';
import { approvedDriver, register } from './seed';
import type { Person } from './stand-kit';
import { standSql } from './stand-tools';

// G86 T8 (docs/122): 1000 mass messages and 50 answers to people at once through the whole stand
// (Worker, queue, D1), with the limit of Telegram on: none lost, 429 none or a few, answers p95 2 s.
const TELEGRAM = `http://localhost:${STAND_TELEGRAM_PORT}`;
const TELEGRAM_PER_SECOND = 30;
const MASS = 1000;
const ANSWERS = 50;
const FIRST_SUBSCRIBER = 970_000;
const FEW_429 = 5;
const P95 = 0.95;
const ANSWER_P95_MS = 2000;
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const person = (id: number, name: string): Person => ({
  id,
  name,
  phone: `99890${String(id).padStart(7, '0')}`,
});
const passengers = Array.from({ length: ANSWERS }, (_, i) => person(960_000 + i, 'Aziz'));
const [booked, posted] = [person(960_900, 'Botir'), person(960_901, 'Davron')];
type Sent = {
  readonly token: string;
  readonly method: string;
  readonly body: { chat_id?: unknown };
  readonly at: number;
};
const sent = async (): Promise<Sent[]> => (await fetch(`${TELEGRAM}/__sent`)).json() as Promise<Sent[]>;
const limit = (method: string, body?: string) =>
  fetch(`${TELEGRAM}/__limit`, { method, ...(body === undefined ? {} : { body }) });
const firstTo = (calls: readonly Sent[], ids: ReadonlySet<number>) => {
  const first = new Map<number, number>();
  for (const call of calls) {
    const chat = Number(call.body.chat_id);
    if (ids.has(chat) && !first.has(chat)) first.set(chat, call.at);
  }
  return first;
};

test.setTimeout(600_000);
test.afterEach(async () => {
  await limit('DELETE');
  standSql(`DELETE FROM route_subscriptions WHERE id LIKE 'g86-%'`);
});

test('G86 T8. 1000 mass and 50 answers at once: none lost, no 429, answers in 2 seconds', async () => {
  await approvedDriver(booked, '01G860AA');
  await approvedDriver(posted, '01G861AA');
  for (const passenger of passengers) await register('passenger', passenger, 'male');
  const trip = await publishTrip(booked, CHILONZOR, SAMARQAND, 'door');
  const now = Date.now();
  const rows = Array.from(
    { length: MASS },
    (_, i) =>
      `('g86-${i}', ${FIRST_SUBSCRIBER + i}, 'trips', '${CHILONZOR}', '${SAMARQAND}', NULL, 0, ${now + YEAR_MS}, ${now})`,
  );
  standSql(
    `INSERT INTO route_subscriptions (id, user_id, kind, from_id, to_id, date, woman, expires_at, created_at) VALUES ${rows.join(', ')}`,
  );
  await fetch(`${TELEGRAM}/__sent`, { method: 'DELETE' });
  await limit('POST', String(TELEGRAM_PER_SECOND));
  const start = Date.now();
  // The moment the server answered each person: an answer later than it waited for the pace of the bot.
  const answered = new Map<number, number>();
  await Promise.all([
    publishTrip(posted, CHILONZOR, SAMARQAND, 'door', 2),
    ...passengers.map((passenger) =>
      book(passenger, trip, { seats: 1, mode: 'door', ...TO_SAMARQAND }).then(() =>
        answered.set(passenger.id, Date.now()),
      ),
    ),
  ]);
  const subscribers = new Set(Array.from({ length: MASS }, (_, i) => FIRST_SUBSCRIBER + i));
  const people = new Set(passengers.map((passenger) => passenger.id));
  await expect
    .poll(async () => firstTo(await sent(), subscribers).size, { timeout: 480_000, intervals: [2000] })
    .toBe(MASS);
  const answers = [...firstTo(await sent(), people)]
    .map(([id, at]) => Math.max(0, at - (answered.get(id) ?? start)))
    .sort((a, b) => a - b);
  const { limited } = (await (await limit('GET')).json()) as { limited: number };
  const p95 = answers[Math.ceil(ANSWERS * P95) - 1] ?? Infinity;
  console.log(
    JSON.stringify({ g86: { mass: MASS, answers: answers.length, limited, p95, last: answers.at(-1) } }),
  );
  expect(answers).toHaveLength(ANSWERS);
  expect(limited).toBeLessThanOrEqual(FEW_429);
  expect(p95).toBeLessThanOrEqual(ANSWER_P95_MS);
});
