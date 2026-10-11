import type { BookingsClient } from '@platform/api-client';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { offer } from '../bookings/booking-test-kit';
import { sheetClosed } from '../home/sheet-closed';
import { asked, board, NOW, openBoard, TEN } from './board-test-kit';

beforeEach(() => void vi.useFakeTimers({ toFake: ['Date'], now: NOW }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const olim = { ...asked, id: 'r2', passenger: { ...asked.passenger, firstName: 'Olim' } };
const sheet = async () => within(await screen.findByRole('dialog'));
const offerTo = (name: string) => {
  const row = screen.getByText(name).closest('.request-row') as HTMLElement;
  fireEvent.click(within(row).getByRole('button', { name: 'Taklif yuborish' }));
};

// G79 В13 (docs/170): the sheet of the next request starts from the time of the offer sent last,
// not from the first chip (+1 tap → 0).
describe('the time of the last offer', { timeout: 20_000 }, () => {
  it('is the first choice of the next sheet', async () => {
    const sendOffer = vi.fn<BookingsClient['sendOffer']>(async () => offer);
    openBoard({ bookings: { sendOffer }, requestBoard: async () => board({ others: [asked, olim] }) });
    await screen.findByText('Olim');
    offerTo('Dilnoza');
    const first = await sheet();
    fireEvent.click(first.getByRole('radio', { name: '10:00' }));
    fireEvent.click(await first.findByRole('button', { name: 'Taklif yuborish' }));
    await waitFor(() => expect(sendOffer).toHaveBeenCalledWith('r1', { departAt: TEN, price: 95000 }));
    await sheetClosed();
    offerTo('Olim');
    const next = await sheet();
    expect(next.getByRole('radio', { name: '10:00' }).getAttribute('aria-checked')).toBe('true');
  });
});
