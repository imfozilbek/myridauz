import { toCyrillic } from '@platform/i18n';
import { loadBrand } from '@platform/brands';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { AccountContext, useAccount } from '../account/account-context';
import { booking, offer, request } from '../bookings/booking-test-kit';
import { tap, trip } from '../market/market-test-kit';
import { BecomeDriver } from './become-driver';
import { PASSENGER_ACTIONS } from './home-test-actions';
import { renderHome } from './home-test-kit';
import { PassengerHome } from './passenger-home';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const tileOf = (title: string) => screen.getByText(title).closest('button');
const badgeOf = (title: string) => tileOf(title)?.querySelector('.home-tile-badge')?.textContent;
const hintOf = (title: string) => tileOf(title)?.querySelector('.home-tile-hint')?.textContent;
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

describe('the four tiles of a passenger (G76, mockup g76/2)', { timeout: 20_000 }, () => {
  it('has the same four tiles always, in their order, and says what comes to a new person', async () => {
    home({ bookings: async () => [] });
    await screen.findByText(toCyrillic('Hali safar yoʻq'));
    const titles = [...document.querySelectorAll('.home-tiles-square .home-tile-title')].map(
      (one) => one.textContent,
    );
    expect(titles).toEqual(
      ['Mening safarlarim', 'Suhbatlar', 'Sevimli haydovchilar', 'Yordam'].map((title) => toCyrillic(title)),
    );
    expect(hintOf(toCyrillic('Suhbatlar'))).toBe(toCyrillic('Haydovchilar bilan'));
    expect(hintOf(toCyrillic('Sevimli haydovchilar'))).toBe(toCyrillic('Safardan keyin qoʻshasiz'));
    expect(hintOf(toCyrillic('Yordam'))).toBe(toCyrillic('Savol boʻlsa'));
    for (const gone of ['Profil', 'Qaytish', 'Oxirgi yoʻnalish', 'Soʻrov qoldirish', 'Safar topish'])
      expect(document.querySelector('.home-tiles-square')?.textContent).not.toContain(gone);
  });

  it('counts the seats and puts a number on the ones not in the block', async () => {
    const seat = { ...booking, status: 'confirmed' as const };
    home({
      bookings: async () => [seat, { ...seat, id: 'b2' }, { ...booking, id: 'b3', status: 'declined' }],
    });
    expect(await screen.findByText(toCyrillic('2 ta joy'))).toBeTruthy();
    expect(badgeOf(toCyrillic('Mening safarlarim'))).toBe('1');
  });

  it('says the offers of an open request, then the request alone', async () => {
    home({
      bookings: async () => [],
      asked: async () => [request],
      offers: async () => [offer, { ...offer, id: 'o2' }],
    });
    await waitFor(() => expect(hintOf(toCyrillic('Mening safarlarim'))).toBe(toCyrillic('2 ta taklif')));
    cleanup();
    home({ bookings: async () => [], asked: async () => [request] });
    await waitFor(() => expect(hintOf(toCyrillic('Mening safarlarim'))).toBe(toCyrillic('1 ta soʻrov')));
  });

  it('shows the unread words on «Suhbatlar» and opens the chats with them on top', async () => {
    const about = { role: 'passenger' as const, booking, request: null, offer: null, driver: null };
    const chat = {
      unread: async () => [{ key: booking.chatKey, count: 3, text: 'Qayerdasiz?', at: Date.now() }],
      about: async () => about,
    };
    const { tracked } = home({ bookings: async () => [booking], chat });
    expect(await screen.findByText(toCyrillic('3 ta yangi xabar'))).toBeTruthy();
    expect(badgeOf(toCyrillic('Suhbatlar'))).toBe('3');
    await tap(toCyrillic('Suhbatlar'));
    expect(await screen.findByText('Qayerdasiz?')).toBeTruthy();
    expect(screen.getByText('Jasur')).toBeTruthy();
    expect(tracked).toContainEqual(expect.objectContaining({ name: 'home_tap', target: 'chats' }));
  });

  it('names the trip of a saved driver, else how many are saved', async () => {
    const later = { ...trip, id: 't9', departAt: Date.now() + 86_400_000 };
    home({ bookings: async () => [], favorites: async () => ({ drivers: [trip.driver], trips: [later] }) });
    expect(await screen.findByText(/^Jasur эртага \d\d:\d\d$/u)).toBeTruthy();
    cleanup();
    home({ bookings: async () => [], favorites: async () => ({ drivers: [trip.driver], trips: [] }) });
    expect(await screen.findByText(toCyrillic('1 ta haydovchi'))).toBeTruthy();
  });

  // The choice of a photo opens at once, not after «Rasm qoʻshish» of «Profil» (G79 П18): 2 taps → 1.
  it('asks for a photo on the right of the head and opens the choice of a photo in «Profil»', async () => {
    const clicked = vi.spyOn(HTMLInputElement.prototype, 'click');
    const { tracked } = home({ bookings: async () => [] });
    expect(await screen.findByText(toCyrillic('Ixtiyoriy'))).toBeTruthy();
    await tap(toCyrillic('Rasm qoʻshing'));
    expect(tracked).toContainEqual(expect.objectContaining({ name: 'screen_open', screen: 'profile' }));
    expect(clicked.mock.contexts.some((input) => (input as HTMLInputElement).type === 'file')).toBe(true);
    clicked.mockRestore();
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

describe('«Haydovchi boʻling» under the tiles (G66, G76)', { timeout: 20_000 }, () => {
  it('opens the app of drivers for a passenger without a seat', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    home(
      { bookings: async () => [] },
      <Passenger>
        <BecomeDriver />
      </Passenger>,
    );
    await tap(toCyrillic('Haydovchi boʻling'));
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
    expect(await screen.findByText(toCyrillic('Savol boʻlsa'))).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Haydovchi boʻling'))).toBeNull();
    cleanup();
    home({ bookings: async () => [] }, <BecomeDriver />);
    expect(await screen.findByText(toCyrillic('Hali safar yoʻq'))).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Haydovchi boʻling'))).toBeNull();
  });
});
