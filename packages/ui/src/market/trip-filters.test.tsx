import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { findRoute, searchMarket } from '../find/search-test-kit';
import { testClients } from '../test-shell';
import { FindTripFlow } from './find-trip-flow';
import { renderMarket, trip } from './market-test-kit';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const few = { ...trip, id: 't2', seatsLeft: 1, driver: { ...trip.driver, firstName: 'Bobur' } };
const many = { ...trip, id: 't3', seatsLeft: 3, driver: { ...trip.driver, firstName: 'Sardor' } };
const car = {
  ...many,
  id: 't4',
  bookingRule: 'seats_or_car' as const,
  driver: { ...trip.driver, firstName: 'Olim' },
};
const pill = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }));

describe('the filters over the trips (G41, G59, docs/90 F-P4, docs/118)', { timeout: 20_000 }, () => {
  it('a family of 3 sees only the trips with 3 free seats; the hidden ones are told', async () => {
    renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { ...searchMarket(), searchTrips: async () => [few, many] } }),
    );
    await findRoute();
    expect(await screen.findByText(/^Bobur ★/u)).toBeTruthy();
    pill(/^3$/u);
    expect(screen.queryByText(/^Bobur ★/u)).toBeNull();
    expect(screen.getByText(/^Sardor ★/u)).toBeTruthy();
    pill(/^4$/u);
    // Nothing fits: how many trips the filter hid, and one tap to see them (docs/89 P6).
    expect(await screen.findByText(/2 ta safar/u)).toBeTruthy();
  });

  it('«Boʻsh salon» keeps only the trips that sell the whole car and have nobody yet', async () => {
    renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { ...searchMarket(), searchTrips: async () => [many, car] } }),
    );
    await findRoute();
    expect(await screen.findByText(/^Sardor ★/u)).toBeTruthy();
    // The trip that sells the car says so on its card.
    expect(screen.getByText(/Butun salon: 285\s000/u)).toBeTruthy();
    pill(/Boʻsh salon/u);
    expect(screen.queryByText(/^Sardor ★/u)).toBeNull();
    expect(screen.getByText(/^Olim ★/u)).toBeTruthy();
  });
});
