import { loadBrand } from '@platform/brands';
import { HOUR_MS, type Booking } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import type { Ring } from '../notifications';
import { tripTimeShort, tripTimeText } from '../../shared/telegram/trip-time';
import { requestBooking } from './application/request';
import { whenLines } from './infrastructure/card-when';
import { passengerNews } from './infrastructure/passenger-news';
import { DILNOZA, seats, setup } from './test-kit';
import { PITAK, PLACES } from './card-places';

// 2.10.2026 08:00 … 10:00 in Tashkent, 300 km; the day before at noon.
const START = Date.parse('2026-10-02T03:00:00Z');
const RANGE = { departAt: START, departUntil: START + 2 * HOUR_MS };
const EXACT = { departAt: START, departUntil: null };
const NOON_BEFORE = Date.parse('2026-10-01T07:00:00Z');

async function ranged(): Promise<Booking> {
  const { deps, addTrip } = setup();
  const result = await requestBooking(deps, DILNOZA, addTrip(), seats(1));
  if (!result.ok) throw new Error(result.error);
  const trip = { ...result.value.trip, ...RANGE, firstDepartAt: START, km: 300 };
  return { ...result.value, status: 'confirmed', trip };
}

// G90, docs/216: the bots say a range «08:00 dan 10:00 gacha», the channels «08:00 … 10:00».
describe('a range of departure in the bots (G90, docs/216)', () => {
  it('says one time or the range in the words of the bots and of the channels', () => {
    expect(tripTimeText(EXACT)).toBe('08:00');
    expect(tripTimeText(RANGE)).toBe('08:00 dan 10:00 gacha');
    expect(tripTimeShort(EXACT)).toBe('08:00');
    expect(tripTimeShort(RANGE)).toBe('08:00 … 10:00');
  });

  it('shows the range on the trip card, the old range of a moved one under it', async () => {
    const { trip } = await ranged();
    expect(whenLines(trip, false, NOON_BEFORE)).toEqual(['<b>Ertaga, 2-oktabr · 08:00 dan 10:00 gacha</b>']);
    const moved = { ...trip, departAt: START + HOUR_MS, departUntil: START + 3 * HOUR_MS };
    expect(whenLines(moved, false, NOON_BEFORE)).toEqual([
      '<b>Ertaga, 2-oktabr · 09:00 dan 11:00 gacha</b>',
      '<i>Avval 08:00 dan 10:00 gacha edi</i>',
    ]);
  });

  it('counts the arrival on the road from the departure, else from the end of the range', async () => {
    const { trip } = await ranged();
    const road = (departedAt: number | null) =>
      whenLines({ ...trip, departedAt }, true, START + HOUR_MS)[0]?.replace(/\s/gu, ' ');
    expect(road(START + HOUR_MS)).toBe('<b>Bugun 08:00 dan 10:00 gacha · ≈ 14:00 yetib borasiz</b>');
    expect(road(null)).toBe('<b>Bugun 08:00 dan 10:00 gacha · ≈ 15:00 yetib borasiz</b>');
  });

  it('rings «2 soat qoldi» with the window, at the pitak and at the door', async () => {
    const booking = await ranged();
    const rings: Ring[] = [];
    const tell = passengerNews({
      brand: loadBrand(),
      places: async () => PLACES,
      show: async (_cards, sent) => void rings.push(...sent),
      telegramId: async () => 9,
      unread: async () => 0,
      now: () => START - 2 * HOUR_MS,
    });
    await tell({ ...booking, pitak: PITAK }, 'soon');
    await tell({ ...booking, pitak: null }, 'soon');
    await tell(booking, 'retimed');
    expect(rings.map((ring) => ring.text)).toEqual([
      '🚏 Safarga 2 soat qoldi: 08:00 dan 10:00 gacha pitakda boʻling',
      '🏠 Safarga 2 soat qoldi: haydovchi 08:00 dan 10:00 gacha sizni olib ketadi',
      '⏰ Safar vaqti oʻzgardi: endi <b>08:00 dan 10:00 gacha</b>',
    ]);
  });
});
