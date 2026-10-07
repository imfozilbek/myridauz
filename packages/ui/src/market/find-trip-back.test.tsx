import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { findRoute, searchMarket } from '../find/search-test-kit';
import { testClients } from '../test-shell';
import { FindTripFlow } from './find-trip-flow';
import { renderMarket, tap, trip } from './market-test-kit';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const pill = (name: RegExp) => screen.getByRole('button', { name });
const DRIVER = /^Jasur ★/u;

describe('FindTripFlow: «Orqaga» keeps what the person chose (docs/90)', { timeout: 20_000 }, () => {
  it('keeps the filters after a trip is opened and closed (F-P1)', async () => {
    renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { ...searchMarket(), searchTrips: async () => [trip] } }),
    );
    await findRoute();
    await screen.findByText(DRIVER);
    fireEvent.click(pill(/^2$/u));
    fireEvent.click(pill(/Mashinada ayol bor/u));
    await tap(DRIVER);
    await tap('Orqaga');
    await screen.findByText(DRIVER);
    expect(pill(/^2$/u).getAttribute('aria-pressed')).toBe('true');
    expect(pill(/Mashinada ayol bor/u).getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps «Qayerdan» when the person goes back from the trips (F-P2)', async () => {
    renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { ...searchMarket(), searchTrips: async () => [] } }),
    );
    await findRoute();
    await screen.findByText('Hozircha safar yoʻq');
    await tap('Orqaga');
    expect(await screen.findByText('Qayerga borasiz?')).toBeTruthy();
    expect(screen.getByText(/^Chilonzor/u)).toBeTruthy();
  });
});
