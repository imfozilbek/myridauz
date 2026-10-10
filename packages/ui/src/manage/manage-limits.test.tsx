import type { Journal, JournalKind, Limits } from '@platform/contracts';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tap } from '../market/market-test-kit';
import { renderManagement } from './manage-test-kit';

afterEach(cleanup);

const limitsOf = (maxActiveTrips: number): Limits => ({
  limits: [
    { key: 'schedule.maxActiveTrips', value: maxActiveTrips, base: 3 },
    { key: 'commission.minPerSeat', value: 9000, base: 9000 },
    { key: 'moderation.hours.from', value: 7, base: 7 },
  ],
  history:
    maxActiveTrips === 3 ? [] : [{ key: 'schedule.maxActiveTrips', before: 3, after: 2, by: 'Fozil', at: 1 }],
});
const entry = (kind: JournalKind, action: string, subject = 'c1'): Journal['entries'][number] => ({
  member: 'Aziz',
  kind,
  subject,
  action,
  at: 2,
});

// «Cheklovlar» and «Jurnal» of the owner (G75, docs/128 §4, gap К of docs/158).
describe('«Cheklovlar» and «Jurnal»', () => {
  it('shows each limit with its unit and changes one within its rule', async () => {
    const change = vi.fn(async () => limitsOf(2));
    renderManagement({
      limits: { current: async () => ({ values: {} }), state: async () => limitsOf(3), change },
    });
    await tap('Cheklovlar');
    expect(await screen.findByText('3 ta')).toBeTruthy();
    expect(screen.getByText(/9\s000 soʻm/u)).toBeTruthy();
    expect(screen.getByText('07:00')).toBeTruthy();
    await tap('Haydovchining faol safarlari');
    expect(screen.getByText('1 ta … 10 ta')).toBeTruthy();
    const field = screen.getByLabelText('Haydovchining faol safarlari');
    fireEvent.change(field, { target: { value: '11' } });
    expect(screen.getByText('Saqlash').closest('button')?.disabled).toBe(true);
    fireEvent.change(field, { target: { value: '2' } });
    await tap('Saqlash');
    await waitFor(() => expect(change).toHaveBeenCalledWith('schedule.maxActiveTrips', 2));
    expect(await screen.findByText('2 ta')).toBeTruthy();
    expect(screen.getByText(/3 ta → 2 ta · Fozil/u)).toBeTruthy();
  });

  it('says every decision in words and shows the older ones on «Yana»', async () => {
    const journal = vi.fn(async (before?: number) =>
      before === undefined
        ? {
            entries: [
              entry('application', 'approve'),
              entry('complaint', 'block:7:refund'),
              entry('limits', '2', 'schedule.maxActiveTrips'),
            ],
          }
        : { entries: before > 1 ? [{ ...entry('team', 'add'), at: 1 }] : [] },
    );
    renderManagement({ team: { journal } });
    await tap('Jurnal');
    expect(await screen.findByText('Ariza tasdiqlandi')).toBeTruthy();
    expect(screen.getByText('7 kunga blok · qaytarish taklif qilindi')).toBeTruthy();
    expect(screen.getByText('Haydovchining faol safarlari: 2')).toBeTruthy();
    await tap('Yana');
    expect(await screen.findByText('Jamoaga qoʻshildi')).toBeTruthy();
    await tap('Yana');
    await waitFor(() => expect(screen.queryByText('Yana')).toBeNull());
  });
});
