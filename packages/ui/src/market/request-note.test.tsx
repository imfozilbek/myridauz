import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { tap } from './market-test-kit';
import { openRequest, row, toPoints } from './request-test-kit';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

// «Izoh (ixtiyoriy)» of a request (G48, docs/68): the same row and sheet as on a booking, so the
// driver of an accepted offer knows where and whom to meet.
describe('the note of a request', { timeout: 20_000 }, () => {
  it('may stay empty, and goes with the request once written', async () => {
    const publishRequest = openRequest();
    await toPoints();
    fireEvent.click(row('Izoh (ixtiyoriy)'));
    expect(screen.getByText('0 / 60')).toBeTruthy();
    fireEvent.change(await screen.findByPlaceholderText('Izoh yozing'), {
      target: { value: 'Koʻk darvoza' },
    });
    await tap('Davom etish');
    expect(await screen.findByText('Koʻk darvoza')).toBeTruthy();
    await tap('Soʻrov qoldirish');
    await screen.findByText('Soʻrovni bekor qilish');
    expect(publishRequest).toHaveBeenLastCalledWith(expect.objectContaining({ note: 'Koʻk darvoza' }));
  });
});
