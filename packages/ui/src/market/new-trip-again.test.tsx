import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ROUTE, tap } from './market-test-kit';
import { openNewTrip } from './new-trip-test-kit';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const AGAIN = { pickupMode: 'door', seats: 2, price: 90_000, comment: 'Konditsioner bor' } as const;

describe('«Oxirgi yoʻnalish»: the last trip again (G40, docs/106 K3, G63)', { timeout: 20_000 }, () => {
  it('opens the one screen with the answers of the last trip; the day is the first free one', async () => {
    const { publishTrip } = openNewTrip({ route: ROUTE, again: AGAIN });
    expect(await screen.findByText('Konditsioner bor')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Uydan' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText(/^90\s000$/u)).toBeTruthy();
    await tap('Eʼlon qilish');
    expect(publishTrip).toHaveBeenCalledWith(
      expect.objectContaining({ ...AGAIN, from: ROUTE.from.id, to: ROUTE.to.id, womanOnBoard: false }),
    );
  });

  it('every answer can change: the comment opens with the last one', async () => {
    openNewTrip({ route: ROUTE, again: AGAIN });
    await tap('Izoh');
    expect(((await screen.findByPlaceholderText('Izoh yozing')) as HTMLTextAreaElement).value).toBe(
      AGAIN.comment,
    );
  });
});
