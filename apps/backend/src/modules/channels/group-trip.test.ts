import { toCyrillic } from '@platform/i18n';
import { describe, expect, it } from 'vitest';
import { PLACES, TRIP } from './channels-fixtures';
import { channelPost } from './infrastructure/post-text';
import type { GroupLook } from './infrastructure/group-look';

// 1.10.2026 05:00 in Tashkent: the trip (2.10 08:30) is tomorrow.
const BEFORE = Date.parse('2026-10-01T00:00:00Z');
const GROUP = '-100700';
const LOOK: GroupLook = {
  chats: new Set([GROUP]),
  cards: { cyrillic: true, marks: { trip: '111', request: '222' } },
};
const render = channelPost('test_bot', LOOK);
type Args = Parameters<typeof render>;
const inGroup = (trip: Args[0], now = BEFORE) => render(trip, PLACES, now, GROUP);
const lines = (text: string) => text.split('\n').map((line) => line.replace(/\s/gu, ' '));
const AMBER = '<tg-emoji emoji-id="111">🟧</tg-emoji>';
const BOOK = 'https://t.me/test_bot?startapp=trip_trip-1__ch-100700';

// A trip of the Mini App as the group's own cards (owner, 05.11.2026, mockup of docs/223).
describe('the trip card of a direction group (G94, docs/223)', () => {
  it('the head with the amber R, the check, both ends, the time, the seats; Cyrillic, the car in Latin', () => {
    const { text, markup } = inGroup(TRIP);
    expect(lines(text)).toEqual([
      `<b>🚗 ОЛИБ КЕТАМАН · Самарқанд шаҳрига</b> ${AMBER}`,
      '✅ Текширилган · 🆕 Янги ҳайдовчи',
      '📍 Чилонзордан (Тошкент шаҳри), Тошкент автовокзалидан ёки уйингиздан',
      '🏁 Самарқанд шаҳригача, уйингизгача',
      '🕒 Эртага, 2-октябр 08:30 да йўлга чиқади, ≈ 13:30 да етади',
      '💺 3 та бўш жой · 💰 85 000',
      '👩 Машинада аёл бор',
    ]);
    expect(markup).toEqual({ inline_keyboard: [[{ text: '💺 Жой банд қилиш', url: BOOK }]] });
    expect(text).not.toMatch(/Jasur|01A|\+998/u);
  });

  it('a car with 4 free seats is «BOʻSH» with its model; a rating; at the door', () => {
    const trip = {
      ...TRIP,
      seatsLeft: 4,
      woman: false,
      pickupMode: 'door' as const,
      driver: { ...TRIP.driver, rating: { average: 4.8, count: 12 } },
    };
    const head = lines(inGroup(trip).text);
    expect(head[0]).toBe(`<b>🚗 БЎШ Cobalt · Самарқанд шаҳрига</b> ${AMBER}`);
    expect(head[1]).toBe('✅ Текширилган · ⭐ 4,8');
    expect(head[2]).toBe('📍 Чилонзордан (Тошкент шаҳри), уйингиздан');
    expect(head).toHaveLength(6);
  });

  it('the last seat, and a range of time without the arrival (docs/216)', () => {
    const range = { ...TRIP, seatsLeft: 1, departUntil: TRIP.departAt + 2 * 3_600_000 };
    const shown = lines(inGroup(range).text);
    expect(shown).toContain('🕒 Эртага, 2-октябр 08:30 … 10:30 да йўлга чиқади');
    expect(shown).toContain('🔥 1 та жой қолди · 💰 85 000');
  });

  it('a full or cancelled trip says so in Cyrillic too; channels keep their post', () => {
    expect(inGroup({ ...TRIP, seatsLeft: 0, status: 'full' }).text).toContain('Жой қолмади');
    const cancelled = inGroup({ ...TRIP, status: 'cancelled' });
    expect(cancelled.text).toContain('Сафар бекор қилинди');
    expect(cancelled.remove).toBe(true);
    expect(render(TRIP, PLACES, BEFORE, '@ch_samarqand').text).toContain(toCyrillic('🆕 Yangi safar'));
  });

  it('without a look of its own a group gets the channel post', () => {
    expect(channelPost('test_bot')(TRIP, PLACES, BEFORE, GROUP).text).toContain(toCyrillic('🆕 Yangi safar'));
  });
});
