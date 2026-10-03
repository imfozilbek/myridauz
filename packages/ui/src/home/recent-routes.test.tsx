import type { Location } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { tap } from '../market/market-test-kit';
import { rememberRoute } from '../market/recent-routes';
import { PASSENGER_ACTIONS, renderHome } from './home-test-kit';
import { PassengerHome } from './passenger-home';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const place = (id: string, parentId: string, name: string): Location => ({
  id,
  parentId,
  type: 'district',
  name,
  lat: 41,
  lng: 69,
  oneCity: false,
});
const open = () =>
  renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, {
    bookings: async () => [],
    covered: 'find_trip',
  });

describe('«Oldingi yoʻnalishlar» on the main screen (G35, docs/97 K5)', { timeout: 20_000 }, () => {
  it('opens the trips of a searched route in one tap', async () => {
    rememberRoute({
      from: place('1726269', '1726', 'Chilonzor'),
      to: place('1730401', '1730', 'Fargʻona shahri'),
    });
    open();
    expect(await screen.findByText('Oldingi yoʻnalishlar')).toBeTruthy();
    await tap('Chilonzor → Fargʻona shahri');
    // The results of the route with their days, no route screen on the way.
    expect(await screen.findByText('Boshqa kun')).toBeTruthy();
    expect(screen.queryByText('Davom etish')).toBeNull();
  });

  it('shows nothing before the first search, or for a place the directory no longer has', async () => {
    open();
    expect(await screen.findByText('Qayerga borasiz?')).toBeTruthy();
    expect(screen.queryByText('Oldingi yoʻnalishlar')).toBeNull();
    cleanup();
    rememberRoute({ from: place('9999', '1726', 'Yoʻq'), to: place('1730401', '1730', 'Fargʻona shahri') });
    open();
    expect(await screen.findByText('Qayerga borasiz?')).toBeTruthy();
    expect(screen.queryByText('Oldingi yoʻnalishlar')).toBeNull();
  });
});
