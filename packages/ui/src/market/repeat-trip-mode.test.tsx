import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ROUTE, tap } from './market-test-kit';
import { openNewTrip } from './new-trip-test-kit';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const AGAIN = { pickupMode: 'both', seats: 2, price: 90_000, comment: '' } as const;

// A trip that repeats another one takes its way of pickup only where the new direction has a pitak;
// elsewhere «Uydan», with no extra question (G63: the server refuses a pitak that is not).
describe('the way of pickup of a repeated trip (G63)', { timeout: 20_000 }, () => {
  it('«Oxirgi yoʻnalish» on a direction without a pitak takes people at their doors', async () => {
    const { publishTrip } = openNewTrip({ route: ROUTE, again: AGAIN, pitak: false });
    await screen.findByText('Safar eʼlon qilish');
    expect(screen.queryByRole('radio', { name: 'Ikkalasi' })).toBeNull();
    await tap('Eʼlon qilish');
    expect(publishTrip).toHaveBeenCalledWith(expect.objectContaining({ pickupMode: 'door' }));
  });

  it('«Oxirgi yoʻnalish» with the pitak keeps the way of the last trip', async () => {
    const { publishTrip } = openNewTrip({ route: ROUTE, again: AGAIN });
    expect(await screen.findByRole('radio', { name: 'Ikkalasi', checked: true })).toBeTruthy();
    await tap('Eʼlon qilish');
    expect(publishTrip).toHaveBeenCalledWith(expect.objectContaining({ pickupMode: 'both' }));
  });
});
