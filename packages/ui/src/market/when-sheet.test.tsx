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
const FREE: Schedule = { windows: [], full: false };

function open(schedule: Schedule = FREE) {
  const onDone = vi.fn();
  renderMarket(
    <WhenSheet open now={NOW} schedule={schedule} onClose={() => undefined} onDone={onDone} />,
    testClients({}),
  );
  return onDone;
}
// The tiles of the half hours (G75, mockup g75/3 A phone 1): the chosen one is pressed, the others
// the driver may take are on, the rest gray.
const tiles = () => [...document.querySelectorAll<HTMLButtonElement>('.time-chip')];
const time = async () => (await screen.findAllByRole('button', { pressed: true })).at(-1)?.textContent;
const times = () =>
  tiles()
    .filter((tile) => !tile.disabled)
    .map((tile) => tile.textContent);

// G38 (owner decisions 03.10.2026, docs/103): the day and the time in one sheet (G75).
describe('WhenSheet', () => {
  it('today: the first time an hour ahead, up to 30 minutes; nothing sooner', async () => {
    const onDone = open();
    expect(await time()).toBe('15:30');
    expect(times()[0]).toBe('15:30');
    expect(tiles().find((tile) => tile.textContent === '15:00')?.disabled).toBe(true);
    await tap('Tayyor');
    const departAt = tashkentDayStart('2026-10-01') + 15.5 * HOUR;
    expect(onDone).toHaveBeenCalledWith({ date: '2026-10-01', time: '15:30', departAt });
  });

  it('another day opens at 08:00, or at the first free time after it', async () => {
    const morning = tashkentDayStart('2026-10-02');
    open({ windows: [{ from: morning + 7 * HOUR, to: morning + 9 * HOUR }], full: false });
    await tap('Ertaga');
    expect(await time()).toBe('09:00');
    expect(times()).not.toContain('08:00');
    expect(times()).toContain('07:00');
  });

  it('at the limit of trips: the reason and no way on', async () => {
    open({ windows: [], full: true });
    expect(await screen.findByText(/Faol eʼlonlar soni chegaraga yetdi/u)).toBeTruthy();
    expect(screen.queryByText('Tayyor')).toBeNull();
  });
});
