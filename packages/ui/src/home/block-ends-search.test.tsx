import { toCyrillic } from '@platform/i18n';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROUTE, tap } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { NewRequestFlow } from '../market/new-request-flow';
import { rememberRoute } from '../market/recent-routes';
import type { StartAction } from '../flow/start-action';
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
// The request and «Mening safarlarim» as in the app.
const REAL: Record<string, StartAction['Screen']> = {
  leave_request: NewRequestFlow,
  my_trips: MyRequestsScreen,
};
const ACTIONS = PASSENGER_ACTIONS.map((action) => ({ ...action, Screen: REAL[action.id] ?? action.Screen }));
const home = () =>
  renderHome((go) => <PassengerHome go={go} />, ACTIONS, { bookings: async () => [], where: true });
// The trips open on today: the first day of the row of the week stands out (docs/172).
const today = () =>
  waitFor(() => expect(document.querySelector('.week-day')?.getAttribute('aria-pressed')).toBe('true'));

// G79 П20, П21 (docs/170): the ends of the block are not asked again; 3 taps → 2.
describe('the ends of the block at the bottom of the main screen', { timeout: 20_000 }, () => {
  it('only «Qayerga»: «Safar topish» asks «Qayerdan», then the trips at once', async () => {
    home();
    await screen.findByText(HERE);
    fireEvent.click(screen.getByRole('button', { name: toCyrillic('Joylarni almashtirish') }));
    fireEvent.click(screen.getByRole('button', { name: toCyrillic('Safar topish') }));
    expect(await screen.findByText(toCyrillic('Qayerdan yoʻlga chiqasiz?'))).toBeTruthy();
    await tap(toCyrillic('Fargʻona'));
    await tap(toCyrillic('Fargʻona shahri'));
    await today();
  });

  it('only «Qayerga»: «Soʻrov qoldirish» asks «Qayerdan», then the day', async () => {
    home();
    await screen.findByText(HERE);
    fireEvent.click(screen.getByRole('button', { name: toCyrillic('Joylarni almashtirish') }));
    await tap(toCyrillic('Soʻrov qoldirish'));
    expect(await screen.findByText(toCyrillic('Qayerdan yoʻlga chiqasiz?'))).toBeTruthy();
    await tap(toCyrillic('Fargʻona'));
    await tap(toCyrillic('Fargʻona shahri'));
    expect(await screen.findByText(toCyrillic('Qaysi kuni?'))).toBeTruthy();
  });

  it('an empty «Suhbatlar» searches from the ends of the block', async () => {
    rememberRoute(ROUTE);
    home();
    await screen.findByText(HERE);
    await tap(toCyrillic('Suhbatlar'));
    await screen.findByText(toCyrillic('Hali suhbat yoʻq'));
    await tap(toCyrillic('Safar topish'));
    await today();
  });

  it('an empty «Faol» of «Mening safarlarim» searches from the ends of the block', async () => {
    rememberRoute(ROUTE);
    home();
    await screen.findByText(HERE);
    await tap(toCyrillic('Mening safarlarim'));
    await screen.findByText(toCyrillic('Faol safar yoʻq'));
    await tap(toCyrillic('Safar topish'));
    await today();
  });
});
