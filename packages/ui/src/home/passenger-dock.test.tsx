import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROUTE, tap } from '../market/market-test-kit';
import { recentRoutes, rememberRoute } from '../market/recent-routes';
import { PASSENGER_ACTIONS } from './home-test-actions';
import { renderHome } from './home-test-kit';
import { PassengerHome } from './passenger-home';

const location = vi.hoisted(() => ({
  knownPosition: vi.fn(async (): Promise<{ lat: number; lng: number } | null> => ({ lat: 41.3, lng: 69.2 })),
}));
vi.mock('../telegram/location', () => location);
afterEach(() => {
  cleanup();
  localStorage.clear();
});

const HERE = 'Joylashuvingiz boʻyicha aniqlandi';
const home = () =>
  renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, { bookings: async () => [], where: true });
const fromLine = () => screen.getByText('Qayerdan').closest('button');
const toLine = () => screen.getByText('Qayerga').closest('button');

describe(
  '«Qayerdan / Qayerga» at the bottom of the main screen (G66, mockup g66/1)',
  { timeout: 20_000 },
  () => {
    it('fills «Qayerdan» where the person stands and says so', async () => {
      home();
      expect(await screen.findByText(HERE)).toBeTruthy();
      expect(fromLine()?.textContent).toContain('Chilonzor');
    });

    it('takes the start of the last route when the place is not known, without the note', async () => {
      location.knownPosition.mockResolvedValue(null);
      rememberRoute({ from: ROUTE.to, to: ROUTE.from });
      home();
      await waitFor(() => expect(fromLine()?.textContent).toContain('Fargʻona'));
      expect(screen.queryByText(HERE)).toBeNull();
      location.knownPosition.mockReset();
      location.knownPosition.mockResolvedValue({ lat: 41.3, lng: 69.2 });
    });

    it('swaps the ends with ⇅', async () => {
      home();
      await screen.findByText(HERE);
      fireEvent.click(screen.getByRole('button', { name: 'Joylarni almashtirish' }));
      expect(screen.getByText('Qayerdan ketasiz?')).toBeTruthy();
      expect(toLine()?.textContent).toContain('Chilonzor');
    });

    it('opens the directions from «Qayerga», keeps «Qayerdan» and counts the trips of the pick', async () => {
      const { tracked } = home();
      await screen.findByText(HERE);
      await tap('Qayerga borasiz?');
      await tap('Fargʻona');
      expect(await screen.findByText('Bugun 1, ertaga 0 ta safar')).toBeTruthy();
      expect(screen.getByText(HERE)).toBeTruthy();
      expect(tracked).toContainEqual(expect.objectContaining({ name: 'home_tap', target: 'dock_to' }));
      // «Safar topish» opens the trips of the route and keeps it for «Oxirgi yoʻnalish» (G35 K5).
      fireEvent.click(screen.getByRole('button', { name: 'Safar topish' }));
      expect(await screen.findByRole('tab', { name: /Bugun/u, selected: true })).toBeTruthy();
      expect(recentRoutes()[0]).toEqual({ from: ROUTE.from.id, to: '1730' });
    });

    it('asks for the end first when «Safar topish» comes before «Qayerga»', async () => {
      home();
      await screen.findByText(HERE);
      fireEvent.click(screen.getByRole('button', { name: 'Safar topish' }));
      // The directions of the search from where the person stands (G59).
      expect(await screen.findByText('Chilonzor, Toshkentdan')).toBeTruthy();
      expect(screen.getByText('Bugun 2 ta, ertaga 5 ta safar')).toBeTruthy();
    });
  },
);
