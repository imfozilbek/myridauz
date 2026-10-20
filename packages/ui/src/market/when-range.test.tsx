import { tashkentDayStart, type Schedule } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testClients } from '../test-shell';
import { renderMarket, tap } from './market-test-kit';
import { WhenSheet } from './when-sheet';

afterEach(cleanup);

const HOUR = 60 * 60 * 1000;
// 2026-10-01 14:10 in Tashkent; the trips go on 2026-10-02.
const NOW = Date.parse('2026-10-01T09:10:00Z');
const DAY = '2026-10-02';
const FREE: Schedule = { full: false };
const at = (hours: number) => tashkentDayStart(DAY) + hours * HOUR;

function open(initial?: { date: string; time: string; until: string }) {
  const onDone = vi.fn();
  renderMarket(
    <WhenSheet
      open
      now={NOW}
      schedule={FREE}
      {...(initial ? { initial } : {})}
      onClose={() => undefined}
      onDone={onDone}
    />,
    testClients({}),
  );
  return onDone;
}
const tiles = () => [...document.querySelectorAll<HTMLButtonElement>('.time-cell')];
const times = () => tiles().map((tile) => tile.textContent);
const pressed = () =>
  tiles()
    .filter((tile) => tile.ariaPressed === 'true')
    .map((tile) => tile.textContent);
const inside = () => [...document.querySelectorAll('.time-cell-inside')].map((tile) => tile.textContent);
const hint = () => document.querySelector('.form-sheet-hint')?.textContent;
const hours = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => `${String(from + index).padStart(2, '0')}:00`);

// «Oraliqda» (owner decision 20.10.2026, docs/216, mockup g90 phones 1 … 3).
describe('a range of whole hours in «Qachon joʻnaysiz?»', () => {
  it('step 1: the starts with an end only; step 2: the start and its ends up to 3 hours', async () => {
    const onDone = open();
    await tap('Oraliqda');
    await tap('2');
    expect(hint()).toBe('Qaysi soatdan? Toshkent vaqti bilan');
    // 23:00 has no end on its day: not shown (lesson 248).
    expect(times()).toEqual(hours(0, 22));
    await tap('08:00');
    expect(hint()).toBe('08:00 dan qaysi soatgacha? Eng koʻpi 3 soat');
    expect(times()).toEqual(hours(8, 11));
    expect(pressed()).toEqual(['08:00']);
    await tap('10:00');
    expect(onDone).toHaveBeenCalledWith({
      date: DAY,
      time: '08:00',
      departAt: at(8),
      until: '10:00',
      departUntil: at(10),
    });
  });

  it('the start again goes back to step 1; late in the day fewer ends', async () => {
    open();
    await tap('Oraliqda');
    await tap('2');
    await tap('08:00');
    await tap('08:00');
    expect(hint()).toBe('Qaysi soatdan? Toshkent vaqti bilan');
    expect(times()).toEqual(hours(0, 22));
    await tap('21:00');
    expect(times()).toEqual(hours(21, 23));
  });

  it('opens again on the range: its start and ends, the edges in the main color, inside lighter', async () => {
    open({ date: DAY, time: '08:00', until: '10:00' });
    expect(hint()).toBe('Qaysi soatdan? Toshkent vaqti bilan');
    expect(times()).toEqual(hours(8, 11));
    expect(pressed()).toEqual(['08:00', '10:00']);
    expect(inside()).toEqual(['09:00']);
    // Any tap starts a new choice: 11:00 is a start of its own.
    await tap('11:00');
    expect(times()).toEqual(hours(11, 14));
    expect(pressed()).toEqual(['11:00']);
    expect(inside()).toEqual([]);
  });

  it('the end 23:00 of a chosen range is no start: its tap only clears the choice', async () => {
    open({ date: DAY, time: '21:00', until: '23:00' });
    expect(times()).toEqual(hours(21, 23));
    await tap('23:00');
    expect(times()).toEqual(hours(0, 22));
    expect(pressed()).toEqual([]);
  });

  it('«Soat boshida» gives one exact time back', async () => {
    const onDone = open({ date: DAY, time: '08:00', until: '10:00' });
    await tap('Soat boshida');
    expect(hint()).toBe('Toshkent vaqti bilan');
    await tap('09:00');
    expect(onDone).toHaveBeenCalledWith({
      date: DAY,
      time: '09:00',
      departAt: at(9),
      until: null,
      departUntil: null,
    });
    expect(screen.queryByText('Qaysi soatdan? Toshkent vaqti bilan')).toBeNull();
  });
});
