import { toCyrillic } from '@platform/i18n';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { fullScans } from '../../test-d1';
import { ago, booking, DAY, HOUR, iso, NOON, openUrl, people, runTips, tipsDb, trip } from './tips-test-kit';

beforeAll(() => vi.useFakeTimers({ toFake: ['Date'] }));
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// P2: 11 registered 30 h ago and did nothing; 12 opened a trip; 13 registered 2 h ago.
const P2 = `${people(11, 12, 13)}
  UPDATE users SET created_at = ${ago(30 * HOUR)} WHERE id IN (11, 12);
  UPDATE users SET created_at = ${ago(2 * HOUR)} WHERE id = 13;
  INSERT INTO trip_views (trip_id, user_id, first_at) VALUES ('x', '12', '${iso(ago(29 * HOUR))}');`;
// P3: 31 opened a trip ahead 5 h ago; 32 opened and booked it; 33 opened it an hour ago.
const P3 = `${people(20, 31, 32, 33)} ${trip('t3', 20, NOON + DAY, NOON + DAY + 5 * HOUR)}
  INSERT INTO trip_views (trip_id, user_id, first_at) VALUES ('t3', '31', '${iso(ago(5 * HOUR))}'),
    ('t3', '32', '${iso(ago(5 * HOUR))}'), ('t3', '33', '${iso(ago(HOUR))}');
  ${booking('b32', 't3', 32, 'confirmed', ago(4 * HOUR))}`;
// P10: 41 rode 14 days ago, a trip of the route is ahead; 42 rode then and booked again.
const P10 = `${people(21, 41, 42)} ${trip('old', 21, ago(14 * DAY + 8 * HOUR), ago(14 * DAY + 2 * HOUR))}
  ${trip('next', 21, NOON + DAY, NOON + DAY + 5 * HOUR)}
  UPDATE trips SET status = 'completed' WHERE id = 'old';
  ${booking('b41', 'old', 41, 'completed', ago(15 * DAY))} ${booking('b42', 'old', 42, 'completed', ago(15 * DAY))}
  ${booking('b42n', 'next', 42, 'requested', ago(DAY))}`;
// A request: 51 waits 8 h without an offer; 52 has one.
const request = (id: string, passenger: number) =>
  `INSERT INTO ride_requests (id, passenger_id, from_id, to_id, date, expires_at, km, seats, price, status, created_at)
    VALUES ('${id}', ${passenger}, '1726', '1718', '2026-10-06', ${NOON + DAY}, 300, 1, 100000, 'open', ${ago(8 * HOUR)});`;
const REQUEST = `${people(51, 52)} ${request('r51', 51)} ${request('r52', 52)}
  INSERT INTO offers (id, request_id, driver_id, depart_at, price, status, created_at)
    VALUES ('o52', 'r52', 20, ${NOON + DAY}, 100000, 'sent', ${ago(HOUR)});`;

// G70a (docs/232): a passenger who stopped on a step hears its tip from the passenger bot.
describe('the tips of a passenger', () => {
  it('tells each stopped passenger once, silently, with the button of the step', async () => {
    const db = await tipsDb(`${P2} ${P3} ${P10} ${REQUEST}`);
    const sent = await runTips(db);
    expect(sent.map((one) => [one.bot, one.chat]).sort()).toEqual([
      ['passenger', 11],
      ['passenger', 31],
      ['passenger', 41],
      ['passenger', 51],
    ]);
    const to = (chat: number) => sent.find((one) => one.chat === chat);
    expect(to(11)?.body).toMatchObject({
      text: toCyrillic('Qayerga borasiz? Yoʻnalishni tanlang: bugungi va ertangi safarlar shu yerda.'),
      disable_notification: true,
      reply_markup: {
        inline_keyboard: [[{ text: toCyrillic('Safar topish') }], [{ callback_data: 'tips_off' }]],
      },
    });
    expect(openUrl(to(11)).searchParams.get('via')).toBe('bot-tip-p2');
    expect(to(31)?.body.text).toBe(
      toCyrillic('Siz koʻrgan safarda hali boʻsh joy bor. Joyni band qilib qoʻyasizmi?'),
    );
    expect(Object.fromEntries(openUrl(to(31)).searchParams)).toEqual({ trip: 't3', via: 'bot-tip-p3' });
    expect(to(41)?.body.text).toBe(
      toCyrillic('Yana yoʻlga chiqasizmi? Yoʻnalishingizda yangi safarlar bor.'),
    );
    expect(openUrl(to(41)).searchParams.get('find')).toBe('1726_1718_2026-10-06');
    expect(Object.fromEntries(openUrl(to(51)).searchParams)).toEqual({ request: 'r51', via: 'bot-tip-req' });
    expect(fullScans(db)).toEqual([]);
  });

  it('tells nothing again within the week, and nothing at night', async () => {
    const db = await tipsDb(`${P2} ${P3}`);
    expect(await runTips(db, NOON + 9 * HOUR)).toEqual([]);
    expect(await runTips(db)).toHaveLength(2);
    expect(await runTips(db, NOON + HOUR)).toEqual([]);
    expect(await runTips(db, NOON + 2 * DAY)).toEqual([]);
  });

  it('tells P2 a second time a week later, never a third', async () => {
    const db = await tipsDb(P2);
    expect(await runTips(db)).toHaveLength(1);
    expect(await runTips(db, NOON + 7 * DAY + HOUR)).toHaveLength(1);
    const fresh = await tipsDb(`${P2} INSERT INTO tips (user_id, step, sent_at)
      VALUES (11, 'p2', ${ago(30 * DAY)}), (11, 'p2', ${ago(20 * DAY)});`);
    expect(await runTips(fresh)).toEqual([]);
  });
});
