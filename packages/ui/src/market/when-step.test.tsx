import type { Schedule } from '@platform/contracts';
import { tashkentDayStart } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testClients } from '../test-shell';
import { renderMarket, tap } from './market-test-kit';
import { WhenStep } from './when-step';

afterEach(cleanup);

const HOUR = 60 * 60 * 1000;
// 2026-10-01 14:10 in Tashkent.
const NOW = Date.parse('2026-10-01T09:10:00Z');
const FREE: Schedule = { windows: [], full: false };

function open(schedule: Schedule = FREE) {
  const onDone = vi.fn();
  renderMarket(
    <WhenStep now={NOW} schedule={schedule} onBack={() => undefined} onDone={onDone} />,
    testClients({}),
  );
  return onDone;
}
const time = async () =>
  ((await screen.findByLabelText('Soat nechada joʻnaysiz?')) as HTMLSelectElement).value;
const times = () =>
  [...(screen.getByLabelText('Soat nechada joʻnaysiz?') as HTMLSelectElement).options].map((o) => o.value);

// G38 (owner decisions 03.10.2026, docs/103): the day and the time on one screen.
describe('WhenStep', () => {
  it('today: the first time an hour ahead, up to 30 minutes; nothing sooner', async () => {
    const onDone = open();
    expect(await time()).toBe('15:30');
    expect(times()[0]).toBe('15:30');
    await tap('Davom etish');
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
    expect(screen.queryByText('Davom etish')).toBeNull();
  });
});
