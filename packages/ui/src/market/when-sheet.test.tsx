import type { Schedule } from '@platform/contracts';
import { tashkentDayStart } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testClients } from '../test-shell';
import { renderMarket, tap } from './market-test-kit';
import { WhenSheet } from './when-sheet';

afterEach(cleanup);

const HOUR = 60 * 60 * 1000;
// 2026-10-01 14:10 in Tashkent.
const NOW = Date.parse('2026-10-01T09:10:00Z');
const FREE: Schedule = { full: false };

function open(schedule: Schedule = FREE, now = NOW) {
  const onDone = vi.fn();
  renderMarket(
    <WhenSheet open now={now} schedule={schedule} onClose={() => undefined} onDone={onDone} />,
    testClients({}),
  );
  return onDone;
}
// The tiles of the free times only (owner decisions 12.10.2026): the chosen one is pressed.
const times = () =>
  [...document.querySelectorAll<HTMLButtonElement>('.time-cell')].map((tile) => tile.textContent);
const time = async () => (await screen.findAllByRole('button', { pressed: true })).at(-1)?.textContent;
const halves = (from: number) =>
  Array.from({ length: 24 - from }, (_, hour) => `${String(from + hour).padStart(2, '0')}:30`);
const wholes = (from: number) =>
  Array.from({ length: 24 - from }, (_, hour) => `${String(from + hour).padStart(2, '0')}:00`);

// G38 (owner decisions 03.10.2026, docs/103): the day and the time in one sheet (G75); the tap on a
// time closes it (G78 В12); the whole hours or the half hours by a switch, only the free times
// (owner decisions 12.10.2026).
describe('WhenSheet', () => {
  it('today: the first time an hour ahead, up to 30 minutes; nothing sooner is shown', async () => {
    const onDone = open();
    expect(await time()).toBe('15:30');
    // It opens on the kind of the chosen time: the half hours from 15:30.
    expect(times()).toEqual(halves(15));
    expect(screen.queryByText('Tayyor')).toBeNull();
    await tap('15:30');
    const departAt = tashkentDayStart('2026-10-01') + 15.5 * HOUR;
    expect(onDone).toHaveBeenCalledWith({ date: '2026-10-01', time: '15:30', departAt });
  });

  it('switches to the whole hours and back: only the free ones', async () => {
    const onDone = open();
    await tap('Soat boshida');
    expect(times()).toEqual(wholes(16));
    await tap('16:00');
    const departAt = tashkentDayStart('2026-10-01') + 16 * HOUR;
    expect(onDone).toHaveBeenCalledWith({ date: '2026-10-01', time: '16:00', departAt });
    await tap('Soat yarimida');
    expect(times()).toEqual(halves(15));
  });

  it('no switch while only one kind has a free time', async () => {
    // 22:20 in Tashkent: 23:30 is the only time left today.
    open(FREE, Date.parse('2026-10-01T17:20:00Z'));
    expect(await time()).toBe('23:30');
    expect(times()).toEqual(['23:30']);
    expect(screen.queryByText('Soat boshida')).toBeNull();
  });

  it('takes the day from the row of the week: 7 days from today (docs/172)', () => {
    open();
    expect(document.querySelectorAll('.week-day')).toHaveLength(7);
    expect(screen.queryByText('Boshqa kun')).toBeNull();
    expect(document.querySelector('input[type="date"]')).toBeNull();
  });

  it('another day opens at 08:00 on the whole hours, every time of it free', async () => {
    open();
    await tap('Soat yarimida');
    await tap('2');
    expect(await time()).toBe('08:00');
    expect(times()).toEqual(wholes(0));
  });

  it('at the limit of trips: the reason and no way on', async () => {
    const onDone = open({ full: true });
    expect(await screen.findByText(/Faol eʼlonlar soni chegaraga yetdi/u)).toBeTruthy();
    await tap('15:30');
    expect(onDone).not.toHaveBeenCalled();
  });
});
