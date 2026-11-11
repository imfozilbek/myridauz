import { toCyrillic } from '@platform/i18n';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROUTE, tap } from '../market/market-test-kit';
import { recentRoutes, rememberRoute } from '../market/recent-routes';
import { PASSENGER_ACTIONS } from './home-test-actions';
import { renderHome } from './home-test-kit';
import { PassengerHome } from './passenger-home';

const location = vi.hoisted(() => ({
  herePosition: vi.fn(async (): Promise<{ lat: number; lng: number } | null> => ({ lat: 41.3, lng: 69.2 })),
}));
vi.mock('../telegram/location', () => location);
afterEach(() => {
  cleanup();
  localStorage.clear();
});

const HERE = toCyrillic('Joylashuvingiz boʻyicha aniqlandi');
const home = () =>
  renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, { bookings: async () => [], where: true });
const fromLine = () => screen.getByText(toCyrillic('Qayerdan')).closest('button');
const toLine = () => screen.getByText(toCyrillic('Qayerga')).closest('button');

describe(
  '«Qayerdan / Qayerga» at the bottom of the main screen (G66, mockup g66/1)',
  { timeout: 20_000 },
  () => {
    it('fills «Qayerdan» where the person stands and says so', async () => {
      home();
      expect(await screen.findByText(HERE)).toBeTruthy();
      expect(fromLine()?.textContent).toContain(toCyrillic('Chilonzor'));
    });

    it('takes the start of the last route when the place is not known, without the note', async () => {
      location.herePosition.mockResolvedValue(null);
      rememberRoute({ from: ROUTE.to, to: ROUTE.from });
      home();
      await waitFor(() => expect(fromLine()?.textContent).toContain(toCyrillic('Fargʻona')));
      expect(screen.queryByText(HERE)).toBeNull();
      location.herePosition.mockReset();
      location.herePosition.mockResolvedValue({ lat: 41.3, lng: 69.2 });
    });

    // The point of the seat tells the district later (G78 П9).
    it('takes Toshkent shahri whole in one tap', async () => {
      home();
      await screen.findByText(HERE);
      fireEvent.click(fromLine() as HTMLElement);
      expect(await screen.findByText(toCyrillic('Butun shahar'))).toBeTruthy();
      await tap(toCyrillic('Toshkent shahri'));
      await waitFor(() => expect(fromLine()?.textContent).toContain(toCyrillic('Toshkent shahri')));
    });

    it('swaps the ends with ⇅', async () => {
      home();
      await screen.findByText(HERE);
      fireEvent.click(screen.getByRole('button', { name: toCyrillic('Joylarni almashtirish') }));
      expect(screen.getByText(toCyrillic('Qayerdan ketasiz?'))).toBeTruthy();
      expect(toLine()?.textContent).toContain(toCyrillic('Chilonzor'));
    });

    // G91 (robot): two empty ends have nothing to swap: ⇅ is off, never a tap that does nothing.
    it('has ⇅ off while both ends are empty', async () => {
      home();
      await screen.findByText(HERE);
      fireEvent.click(screen.getByRole('button', { name: toCyrillic('Joyni tozalash') }));
      const swap = screen.getByRole('button', {
        name: toCyrillic('Joylarni almashtirish'),
      }) as HTMLButtonElement;
      await waitFor(() => expect(swap.disabled).toBe(true));
    });

    // G91 (robot): ⇅ swapped a place with itself. The end chosen last stays, the other one empties.
    it('never shows one place on both ends', async () => {
      home();
      await screen.findByText(HERE);
      await tap(toCyrillic('Qayerga borasiz?'));
      await tap(toCyrillic('Fargʻona'));
      await waitFor(() => expect(document.querySelector('.week-day')).not.toBeNull());
      await tap(toCyrillic('Orqaga'));
      await screen.findByText(toCyrillic('Bugun 1, ertaga 0 ta safar'));
      fireEvent.click(fromLine() as HTMLElement);
      await tap(toCyrillic('Fargʻona viloyati'));
      await tap(toCyrillic('Butun viloyat'));
      await waitFor(() => expect(fromLine()?.textContent).toContain(toCyrillic('Fargʻona')));
      expect(toLine()?.textContent).toContain(toCyrillic('Qayerga borasiz?'));
    });

    it('opens the trips of a direction of «Qayerga» at once and keeps it in the block (G78 П7)', async () => {
      const { tracked } = home();
      await screen.findByText(HERE);
      await tap(toCyrillic('Qayerga borasiz?'));
      await tap(toCyrillic('Fargʻona'));
      expect(tracked).toContainEqual(expect.objectContaining({ name: 'home_tap', target: 'dock_to' }));
      // The days and trips of the route at once, kept for «Oxirgi yoʻnalish» (G35 K5).
      await waitFor(() =>
        expect(document.querySelector('.week-day')?.getAttribute('aria-pressed')).toBe('true'),
      );
      expect(recentRoutes()[0]).toEqual({ from: ROUTE.from.id, to: '1730' });
      // Back on the main screen the block keeps «Qayerdan» and the pick with its trips.
      await tap(toCyrillic('Orqaga'));
      expect(await screen.findByText(toCyrillic('Bugun 1, ertaga 0 ta safar'))).toBeTruthy();
      expect(screen.getByText(HERE)).toBeTruthy();
    });

    it('asks for the end first when «Safar topish» comes before «Qayerga»', async () => {
      home();
      await screen.findByText(HERE);
      fireEvent.click(screen.getByRole('button', { name: toCyrillic('Safar topish') }));
      // The directions of the search from where the person stands (G59).
      expect(await screen.findByText(toCyrillic('Chilonzor, Toshkentdan'))).toBeTruthy();
      expect(screen.getByText(toCyrillic('Bugun 2 ta, ertaga 5 ta safar'))).toBeTruthy();
    });
  },
);
