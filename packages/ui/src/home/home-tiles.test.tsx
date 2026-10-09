import { REQUEST_LINK, DAY_MS } from '@platform/contracts';
import { loadBrand } from '@platform/brands';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { AccountContext, useAccount } from '../account/account-context';
import { booking, offer, request } from '../bookings/booking-test-kit';
import { tap, trip } from '../market/market-test-kit';
import { BecomeDriver } from './become-driver';
import { linkOf, PASSENGER_ACTIONS } from './home-test-actions';
import { renderHome } from './home-test-kit';
import { PassengerHome } from './passenger-home';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// The tile of an action with its badge: the badge is a number inside the tile (G53).
const tileOf = (title: string) => screen.getByText(title).closest('button');
const badgeOf = (title: string) => tileOf(title)?.querySelector('.home-tile-badge')?.textContent;
type Data = Parameters<typeof renderHome>[2];
const home = (data: Data, more: ReactNode = null) =>
  renderHome(
    (go) => (
      <>
        <PassengerHome go={go} />
        {more}
      </>
    ),
    PASSENGER_ACTIONS,
    data,
  );

describe('the tiles of a passenger (G53, G66 mockup g66/1)', { timeout: 20_000 }, () => {
  it('turns «Soʻrov qoldirish» into «Soʻrovim»: where, when, the offers; a tap opens the request', async () => {
    home({
      bookings: async () => [],
      asked: async () => [request],
      offers: async () => [offer, { ...offer, id: 'o2' }, { ...offer, id: 'o3', status: 'declined' }],
    });
    expect(await screen.findByText(/^Fargʻona, .+ · 2 ta taklif$/u)).toBeTruthy();
    expect(screen.queryByText('Soʻrov qoldirish')).toBeNull();
    expect(badgeOf('Soʻrovim')).toBe('2');
    await tap('Soʻrovim');
    expect(screen.getByText(linkOf({ name: REQUEST_LINK, id: request.id }))).toBeTruthy();
  });

  it('keeps «Soʻrov qoldirish» while no request is open', async () => {
    home({ bookings: async () => [], asked: async () => [{ ...request, status: 'expired' as const }] });
    expect(await screen.findByText('Soʻrov qoldirish')).toBeTruthy();
    expect(screen.queryByText('Soʻrovim')).toBeNull();
  });

  it('counts on «Mening safarlarim» the live seats but the one of the card, and opens the profile', async () => {
    const { tracked } = home({
      bookings: async () => [booking, { ...booking, id: 'b2' }, { ...booking, id: 'b3', status: 'declined' }],
    });
    await screen.findByText('Rasm va sozlamalar');
    expect(badgeOf('Mening safarlarim')).toBe('1');
    await tap('Rasm va sozlamalar');
    expect(tracked).toContainEqual(expect.objectContaining({ name: 'screen_open', screen: 'profile' }));
  });

  it('offers «Qaytish» with a seat booked: the way back of its trip (docs/118)', async () => {
    const { tracked } = home({ bookings: async () => [booking] });
    expect(await screen.findByText('Qaytish')).toBeTruthy();
    expect(screen.getByText('Fargʻona → Chilonzor')).toBeTruthy();
    expect(screen.queryByText('Oxirgi yoʻnalish')).toBeNull();
    await tap('Qaytish');
    expect(tracked).toContainEqual(expect.objectContaining({ name: 'home_tap', target: 'come_back' }));
  });

  it('keeps «Qaytish» a week after the trip, then no more', async () => {
    const done = (days: number) => ({
      ...booking,
      status: 'completed' as const,
      trip: { ...trip, departAt: Date.now() - days * DAY_MS },
    });
    home({ bookings: async () => [done(6)] });
    expect(await screen.findByText('Qaytish')).toBeTruthy();
    cleanup();
    home({ bookings: async () => [done(8)] });
    expect(await screen.findByText('Rasm va sozlamalar')).toBeTruthy();
    expect(screen.queryByText('Qaytish')).toBeNull();
  });
});

// A person who is not a driver yet (the account of the tests is both).
function Passenger({ children }: { readonly children: ReactNode }) {
  const account = useAccount();
  const roles = ['passenger'] as const;
  return (
    <AccountContext.Provider
      value={account && { ...account, profile: { ...account.profile, roles: [...roles] } }}
    >
      {children}
    </AccountContext.Provider>
  );
}

describe('«Haydovchi boʻling» under the tiles (G66, docs/118)', { timeout: 20_000 }, () => {
  it('opens the app of drivers for a passenger without a seat', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    home(
      { bookings: async () => [] },
      <Passenger>
        <BecomeDriver />
      </Passenger>,
    );
    await tap('Haydovchi boʻling');
    expect(open.mock.calls[0]?.[0]).toBe(`https://t.me/${loadBrand().bots.driver}?startapp`);
    open.mockRestore();
  });

  it('hides for a seat booked and for a driver', async () => {
    home(
      { bookings: async () => [booking] },
      <Passenger>
        <BecomeDriver />
      </Passenger>,
    );
    expect(await screen.findByText('Qaytish')).toBeTruthy();
    expect(screen.queryByText('Haydovchi boʻling')).toBeNull();
    cleanup();
    home({ bookings: async () => [] }, <BecomeDriver />);
    expect(await screen.findByText('Rasm va sozlamalar')).toBeTruthy();
    expect(screen.queryByText('Haydovchi boʻling')).toBeNull();
  });
});
