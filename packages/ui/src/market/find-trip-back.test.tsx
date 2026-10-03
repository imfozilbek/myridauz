import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { testClients } from '../test-shell';
import { FindTripFlow } from './find-trip-flow';
import { quickRoute, renderMarket, tap, trip } from './market-test-kit';

afterEach(cleanup);

const checkbox = (name: string) => screen.getByRole('checkbox', { name }) as HTMLInputElement;

describe('FindTripFlow: «Orqaga» keeps what the person chose (docs/90)', { timeout: 20_000 }, () => {
  it('keeps the filters after a trip is opened and closed (F-P1)', async () => {
    renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { searchTrips: async () => [trip] } }),
    );
    await quickRoute();
    await screen.findByText('Jasur');
    fireEvent.click(checkbox('Uyimdan olib ketsin'));
    fireEvent.click(checkbox('Mashinada ayol bor'));
    await tap('Jasur');
    await tap('Orqaga');
    await screen.findByText('Jasur');
    expect(checkbox('Uyimdan olib ketsin').checked).toBe(true);
    expect(checkbox('Mashinada ayol bor').checked).toBe(true);
  });

  it('keeps the route when the person goes back from the day (F-P2)', async () => {
    renderMarket(<FindTripFlow onBack={() => undefined} />, testClients({}));
    await quickRoute();
    await screen.findByText('Bugun');
    await tap('Orqaga');
    expect(await screen.findByText('Davom etish')).toBeTruthy();
    expect(screen.getByText('Chilonzor')).toBeTruthy();
    expect(screen.getByText('Fargʻona shahri')).toBeTruthy();
  });
});
