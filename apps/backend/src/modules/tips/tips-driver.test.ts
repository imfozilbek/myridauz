import { toCyrillic } from '@platform/i18n';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { fullScans } from '../../test-d1';
import {
  ago,
  approved,
  booking,
  DAY,
  HOUR,
  NOON,
  openUrl,
  people,
  runTips,
  tipsDb,
  trip,
} from './tips-test-kit';

beforeAll(() => vi.useFakeTimers({ toFake: ['Date'] }));
afterAll(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// D1: 61 left a draft 30 h ago; 62 is an approved driver changing the car.
const D1 = `${people(61, 62)}
  INSERT INTO driver_applications (user_id, status, updated_at) VALUES (61, 'draft', ${ago(30 * HOUR)}),
    (62, 'draft', ${ago(30 * HOUR)});
  INSERT INTO application_log (user_id, status, reasons, decided_by, decided_at) VALUES (62, 'approved', '[]', 900, 0);`;
// D2: 71 approved 50 h ago with a bonus, 72 without one, 73 published a trip.
const D2 = `${people(71, 72, 73)} ${approved(71, ago(50 * HOUR))} ${approved(72, ago(50 * HOUR))}
  ${approved(73, ago(50 * HOUR))} ${trip('t73', 73, NOON + DAY, NOON + DAY + 5 * HOUR)}
  INSERT INTO wallet_operations (id, driver_id, kind, balance, amount, expires_at, created_at)
    VALUES ('w71', 71, 'bonus_grant', 'bonus', 500000, ${NOON + 30 * DAY}, ${ago(50 * HOUR)});`;
// D7: the trip of 81 leaves in 6 h without a booking; 82 has a booking; 83 drives for a request.
const D7 = `${people(81, 82, 83, 84)}
  ${trip('t81', 81, NOON + 6 * HOUR, NOON + 11 * HOUR)} ${trip('t82', 82, NOON + 6 * HOUR, NOON + 11 * HOUR)}
  ${trip('t83', 83, NOON + 6 * HOUR, NOON + 11 * HOUR, "UPDATE trips SET for_request = 'r' WHERE id = 't83';")}
  UPDATE trips SET created_at = ${ago(DAY)} WHERE id IN ('t81', 't82', 't83');
  ${booking('b82', 't82', 84, 'requested')}`;
// D4: the last trip of 91 ended 21 days ago.
const D4 = `${people(91)} INSERT INTO driver_applications (user_id, status, updated_at) VALUES (91, 'approved', 0);
  ${trip('t91', 91, ago(21 * DAY + 9 * HOUR), ago(21 * DAY + 3 * HOUR))}`;

// G70a (docs/232): a driver who stopped on a step hears its tip from the driver bot.
describe('the tips of a driver', () => {
  it('tells each stopped driver once, silently, with the button of the step', async () => {
    const db = await tipsDb(`${D1} ${D2} ${D7} ${D4}`);
    const sent = await runTips(db);
    expect(sent.map((one) => [one.bot, one.chat]).sort()).toEqual([
      ['driver', 61],
      ['driver', 71],
      ['driver', 72],
      ['driver', 81],
      ['driver', 91],
    ]);
    const to = (chat: number) => sent.find((one) => one.chat === chat);
    expect(to(61)?.body).toMatchObject({
      text: toCyrillic('Arizangiz deyarli tayyor. Qolgan qadamni tugating, keyin safar eʼlon qila olasiz.'),
      disable_notification: true,
      reply_markup: {
        inline_keyboard: [[{ text: toCyrillic('Arizani davom ettirish') }], [{ callback_data: 'tips_off' }]],
      },
    });
    expect(openUrl(to(61)).searchParams.get('via')).toBe('bot-tip-d1');
    // The bonus only when there is one (docs/232).
    expect(String(to(71)?.body.text).replace(/\s/gu, ' ')).toBe(
      toCyrillic(
        'Birinchi safaringizni eʼlon qiling: yoʻlovchilar kutyapti. Hamyoningizda 500 000 soʻm bonus bor.',
      ),
    );
    expect(to(72)?.body.text).toBe(toCyrillic('Birinchi safaringizni eʼlon qiling: yoʻlovchilar kutyapti.'));
    expect(Object.fromEntries(openUrl(to(72)).searchParams)).toEqual({ open: 'new_trip', via: 'bot-tip-d2' });
    expect(to(81)?.body.text).toBe(
      toCyrillic('Safaringizda hali yoʻlovchi yoʻq. Havolani tanishlaringizga va guruhlarga yuboring.'),
    );
    expect(Object.fromEntries(openUrl(to(81)).searchParams)).toEqual({ mytrip: 't81', via: 'bot-tip-d7' });
    expect(to(91)?.body.text).toBe(
      toCyrillic('Yana yoʻlga chiqasizmi? Yangi safarni bir necha bosishda eʼlon qilasiz.'),
    );
    expect(openUrl(to(91)).searchParams.get('via')).toBe('bot-tip-d4');
    expect(fullScans(db)).toEqual([]);
  });

  it('stops a step once it is done', async () => {
    const db = await tipsDb(D2);
    await db.exec(
      `${trip('t71', 71, NOON + DAY, NOON + DAY + 5 * HOUR)} ${trip('t72', 72, NOON + DAY, NOON + DAY)}`,
    );
    expect(await runTips(db)).toEqual([]);
  });
});
