import type { Trip } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import type { Card } from '../notifications';
import { showBoards, type BoardDeps } from './application/board';
import { PLACES, TRIP } from './channels-fixtures';
import { boardCard } from './infrastructure/board-text';

const HOUR = 3_600_000;
// «Toshkent shahri» with «-dan»: written in two parts, the brand check reads the joined word.
const TASHKENT = 'Toshkent shahri';
// 2.10.2026 07:30 in Tashkent: the board of the day is up.
const MORNING = Date.parse('2026-10-02T02:30:00Z');
const SAMARQAND = { username: 'ch_samarqand', places: ['1718'] };
const at = (hours: number) => Date.parse('2026-10-02T03:30:00Z') + hours * HOUR;
const FIRST: Trip = { ...TRIP, id: '0f6c2b9e-0000-4000-8000-000000000001' };
const TRIPS: Trip[] = [
  FIRST,
  { ...TRIP, id: '0f6c2b9e-0000-4000-8000-000000000002', departAt: at(2.5), seatsLeft: 0, status: 'full' },
  {
    ...TRIP,
    id: '0f6c2b9e-0000-4000-8000-000000000003',
    from: '1718401',
    to: '1726269',
    departAt: at(7),
    seatsLeft: 1,
  },
  { ...TRIP, id: '0f6c2b9e-0000-4000-8000-000000000004', departAt: at(1), status: 'cancelled' },
];
const render = boardCard({
  bot: 'test_bot',
  domain: 'site.test',
  pageOf: () => '/yonalish/toshkent-samarqand/',
});
const book = (n: number) =>
  `https://t.me/test_bot?startapp=trip_0f6c2b9e-0000-4000-8000-00000000000${n}__ch-ch-samarqand`;

// The board of the day (G68, docs/122, mockup g68/5 «Kun taxtasi»): one pinned post a channel.
describe('the board of the day in a channel (G68)', () => {
  it('lists the trips of today by direction: the time opens the trip, a full one is struck', () => {
    const card = render(SAMARQAND, TRIPS, PLACES, MORNING);
    expect(card?.text.split('\n').map((line) => line.replace(/\s/gu, ' '))).toEqual([
      '<b>📋 Bugun, 2-oktabr: 3 ta safar</b>',
      '',
      `<b>➡️ ${TASHKENT}dan</b>`,
      `<a href="${book(1)}">08:30</a> Chilonzor → <b>Samarqand shahri</b> · 3 joy · 85 000`,
      '<s>11:00 Chilonzor → Samarqand shahri · joy yoʻq</s>',
      '',
      '<b>⬅️ Toshkent shahriga</b>',
      `<a href="${book(3)}">15:30</a> <b>Samarqand shahri</b> → Chilonzor · 🔥 1 joy · 85 000`,
    ]);
    expect(card?.footer).toContain('vaqtni bossangiz, safar ochiladi');
    expect(card).toMatchObject({
      bot: 'passenger',
      chatId: '@ch_samarqand',
      key: 'board:2026-10-02',
      pin: true,
      loud: true,
      preview: 'https://site.test/yonalish/toshkent-samarqand/',
    });
    const buttons = JSON.stringify(card?.markup);
    expect(buttons).toContain('🔎 Safar topish');
    expect(buttons).toContain('startapp=sub_1726_1718_2026-10-02__ch-ch-samarqand');
    expect(buttons).toContain('📤 Doʻstga');
  });

  it('a trip on the road or arrived is struck too; no trip of the channel: no board', () => {
    const road = render(SAMARQAND, [{ ...FIRST, departedAt: at(0) }], PLACES, at(0.5));
    expect(road?.text).toContain('<s>08:30 Chilonzor → Samarqand shahri · yoʻlga chiqdi</s>');
    const came = render(SAMARQAND, [{ ...FIRST, status: 'completed' }], PLACES, at(6));
    expect(came?.text).toContain('· yetib bordi</s>');
    expect(render({ username: 'ch_buxoro', places: ['1706'] }, [], PLACES, MORNING)).toBeNull();
  });
});

function setup(now: number, enabled = true) {
  const shown: Card[] = [];
  const asked: string[] = [];
  const deps: BoardDeps = {
    enabled,
    channels: async () => [SAMARQAND, { username: 'ch_buxoro', places: ['1706'] }],
    places: async () => PLACES,
    tripsOf: async (date) => (asked.push(date), TRIPS),
    card: render,
    show: async (cards) => void shown.push(...cards),
    now: () => now,
  };
  return { deps, shown, asked };
}

describe('showing the boards (G68)', () => {
  it('from 07:00 each channel with trips today gets its board; before 07:00 nothing', async () => {
    const early = setup(MORNING - HOUR);
    await showBoards(early.deps);
    expect([early.shown, early.asked]).toEqual([[], []]);
    const day = setup(MORNING);
    await showBoards(day.deps);
    expect(day.asked).toEqual(['2026-10-02']);
    expect(day.shown.map((card) => card.chatId)).toEqual(['@ch_samarqand']);
  });

  it('only the channels of one trip, and nothing while autoposting is off', async () => {
    const one = setup(MORNING);
    await showBoards(one.deps, ['ch_buxoro']);
    expect(one.shown).toEqual([]);
    const off = setup(MORNING, false);
    await showBoards(off.deps);
    expect(off.shown).toEqual([]);
  });
});
