import type { Location } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { rememberRoute } from '../market/recent-routes';
import { PASSENGER_ACTIONS } from './home-test-actions';
import { renderHome } from './home-test-kit';
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
  });

describe('the last searched route in the block at the bottom (G35 K5, G76)', { timeout: 20_000 }, () => {
  it('fills «Qayerdan» and «Qayerga» with it: no tile repeats it (docs/165)', async () => {
    rememberRoute({
      from: place('1726269', '1726', 'Chilonzor'),
      to: place('1730401', '1730', 'Fargʻona shahri'),
    });
    open();
    expect(await screen.findByText(/Fargʻona/u, { selector: '.home-dock-value' })).toBeTruthy();
    expect(screen.queryByText('Oxirgi yoʻnalish')).toBeNull();
  });

  it('asks «Qayerga» before the first search, or for a place the directory no longer has', async () => {
    open();
    expect(await screen.findByText('Qayerga borasiz?')).toBeTruthy();
    cleanup();
    rememberRoute({ from: place('9999', '1726', 'Yoʻq'), to: place('1730401', '1730', 'Fargʻona shahri') });
    open();
    expect(await screen.findByText('Qayerga borasiz?')).toBeTruthy();
  });
});
