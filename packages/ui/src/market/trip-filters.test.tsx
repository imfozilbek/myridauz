import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { testClients } from '../test-shell';
import { FindTripFlow } from './find-trip-flow';
import { quickRoute, renderMarket, tap, trip } from './market-test-kit';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const few = { ...trip, id: 't2', seatsLeft: 1, driver: { ...trip.driver, firstName: 'Bobur' } };
const many = { ...trip, id: 't3', seatsLeft: 3, driver: { ...trip.driver, firstName: 'Sardor' } };

describe('«Necha kishi ketadi?» over the trips (G41, docs/90 F-P4)', { timeout: 20_000 }, () => {
  it('a family of 3 sees only the trips with 3 free seats; the hidden ones are told and come back', async () => {
    renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { searchTrips: async () => [few, many] } }),
    );
    await quickRoute();
    expect(await screen.findByText('Bobur')).toBeTruthy();
    await tap('3 kishi');
    expect(screen.queryByText('Bobur')).toBeNull();
    expect(screen.getByText('Sardor')).toBeTruthy();
    expect(screen.getByRole('tab', { name: '3 kishi', selected: true })).toBeTruthy();
    await tap('4 kishi');
    // Nothing fits: how many trips the filter hid, and one tap to see them (docs/89 P6).
    expect(await screen.findByText(/2 ta safar/u)).toBeTruthy();
  });

  it('shows only the evening trips after «Kechqurun», and the morning ones after «Ertalab» (F-P6)', async () => {
    // 08:00 and 19:00 in Tashkent.
    const evening = { ...many, departAt: Date.parse('2026-10-02T14:00:00Z') };
    renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { searchTrips: async () => [few, evening] } }),
    );
    await quickRoute();
    expect(await screen.findByText('Bobur')).toBeTruthy();
    await tap('Kechqurun');
    expect(screen.queryByText('Bobur')).toBeNull();
    expect(screen.getByText('Sardor')).toBeTruthy();
    await tap('Ertalab');
    expect(await screen.findByText('Bobur')).toBeTruthy();
    expect(screen.queryByText('Sardor')).toBeNull();
  });
});
