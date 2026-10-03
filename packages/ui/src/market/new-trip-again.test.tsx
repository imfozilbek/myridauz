import type { MarketClient } from '@platform/api-client';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { testClients } from '../test-shell';
import { recommendation, renderMarket, ROUTE, tap, trip } from './market-test-kit';
import { NewTripFlow } from './new-trip-flow';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const AGAIN = { pickupMode: 'door', seats: 2, price: 90_000, comment: 'Konditsioner bor' } as const;

function open() {
  const publishTrip = vi.fn<MarketClient['publishTrip']>(async () => trip);
  renderMarket(
    <NewTripFlow route={ROUTE} again={AGAIN} onBack={() => undefined} />,
    testClients({ market: { recommend: async () => recommendation, publishTrip } }),
  );
  return publishTrip;
}

describe('«Oxirgi yoʻnalish»: the last trip again (G40, docs/106 K3)', { timeout: 20_000 }, () => {
  it('asks only the day and time, then the check with the answers of the last trip', async () => {
    const publishTrip = open();
    await tap(/^Ertaga/);
    await tap('Davom etish');
    expect(await screen.findByText('Konditsioner bor')).toBeTruthy();
    await tap('Eʼlon qilish');
    expect(await screen.findByText('Safar eʼlon qilindi')).toBeTruthy();
    expect(publishTrip).toHaveBeenCalledWith(
      expect.objectContaining({ ...AGAIN, from: ROUTE.from.id, to: ROUTE.to.id, womanOnBoard: false }),
    );
  });

  it('«Назад» from the check goes through the answers: each one can change', async () => {
    open();
    await tap(/^Ertaga/);
    await tap('Davom etish');
    await tap('Orqaga');
    expect(((await screen.findByPlaceholderText('Izoh yozing')) as HTMLTextAreaElement).value).toBe(
      AGAIN.comment,
    );
  });
});
