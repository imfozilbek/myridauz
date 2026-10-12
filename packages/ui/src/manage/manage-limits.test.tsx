import type { Journal, JournalKind, Limits } from '@platform/contracts';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tap } from '../market/market-test-kit';
import { renderManagement } from './manage-test-kit';

afterEach(cleanup);

const limitsOf = (maxSeats: number): Limits => ({
  limits: [
    { key: 'requests.maxSeats', value: maxSeats, base: 4 },
    { key: 'commission.minPerSeat', value: 9000, base: 9000 },
    { key: 'moderation.hours.from', value: 7, base: 7 },
  ],
  history: maxSeats === 4 ? [] : [{ key: 'requests.maxSeats', before: 4, after: 3, by: 'Fozil', at: 1 }],
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
    const change = vi.fn(async () => limitsOf(3));
    renderManagement({
      limits: { current: async () => ({ values: {} }), state: async () => limitsOf(4), change },
    });
    await tap('Cheklovlar');
    expect(await screen.findByText('4 ta')).toBeTruthy();
    expect(screen.getByText(/9\s000 soʻm/u)).toBeTruthy();
    expect(screen.getByText('07:00')).toBeTruthy();
    await tap('Bir soʻrovdagi joylar');
    expect(screen.getByText('1 ta … 7 ta')).toBeTruthy();
    // A count goes by «−» and «+», not typed (G79 К9): one tap instead of a keyboard.
    expect(screen.queryByLabelText('Bir soʻrovdagi joylar')).toBeNull();
    expect(screen.getByText('Saqlash').closest('button')?.disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Kamaytirish' }));
    expect(screen.getByText('3 ta')).toBeTruthy();
    await tap('Saqlash');
    await waitFor(() => expect(change).toHaveBeenCalledWith('requests.maxSeats', 3));
    expect(await screen.findByText('3 ta')).toBeTruthy();
    expect(screen.getByText(/4 ta → 3 ta · Fozil/u)).toBeTruthy();
  });

  // A long range is typed, never hundreds of taps (G79 К9, review).
  it('types a limit of a long range', async () => {
    renderManagement({
      limits: { current: async () => ({ values: {} }), state: async () => limitsOf(4), change: vi.fn() },
    });
    await tap('Cheklovlar');
    await tap('Jamoa ishining boshlanishi');
    expect(screen.getByLabelText('Jamoa ishining boshlanishi').tagName).toBe('INPUT');
    expect(screen.queryByRole('button', { name: 'Kamaytirish' })).toBeNull();
  });

  it('says every decision in words and shows the older ones on «Yana»', async () => {
    const journal = vi.fn(async (before?: number) =>
      before === undefined
        ? {
            entries: [
              entry('application', 'approve'),
              entry('complaint', 'block:7:refund'),
              entry('limits', '2', 'requests.maxSeats'),
            ],
          }
        : { entries: before > 1 ? [{ ...entry('team', 'add'), at: 1 }] : [] },
    );
    renderManagement({ team: { journal } });
    await tap('Jurnal');
    expect(await screen.findByText('Ariza tasdiqlandi')).toBeTruthy();
    expect(screen.getByText('7 kunga blok · qaytarish taklif qilindi')).toBeTruthy();
    expect(screen.getByText('Bir soʻrovdagi joylar: 2')).toBeTruthy();
    await tap('Yana');
    expect(await screen.findByText('Jamoaga qoʻshildi')).toBeTruthy();
    await tap('Yana');
    await waitFor(() => expect(screen.queryByText('Yana')).toBeNull());
  });
});
