import { OFFER_LINK } from '@platform/contracts';
import { loadBrand } from '@platform/brands';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { booking, offer, request, wallet } from '../bookings/booking-test-kit';
import type { StartAction } from '../flow/start-action';
import { tap, trip } from '../market/market-test-kit';
import { useDriverTripsLive } from './driver-data';
import { DriverHome } from './driver-home';
import { approved, DRIVER_ACTIONS, linkOf, PASSENGER_ACTIONS, renderHome } from './home-test-kit';
import { useBookingsLive, useOffersLive } from './passenger-data';
import { PassengerHome } from './passenger-home';

afterEach(cleanup);

// The tile of an action with its badge: the badge is a number inside the tile (G53).
const tileOf = (title: string) => screen.getByText(title).closest('button');
const live = (actions: readonly StartAction[], useLive: StartAction['useLive']) =>
  actions.map((action) => (action.id === 'my_trips' && useLive ? { ...action, useLive } : action));

describe('the tiles of a passenger (G53)', { timeout: 20_000 }, () => {
  it('counts the offers waiting for an answer and opens the first one from the request', async () => {
    const actions = [
      ...PASSENGER_ACTIONS,
      {
        ...PASSENGER_ACTIONS[1]!,
        id: 'leave_request',
        labelKey: 'common.passenger.leaveRequest' as const,
        useLive: useOffersLive,
      },
    ];
    renderHome((go) => <PassengerHome go={go} />, actions, {
      bookings: async () => [],
      asked: async () => [request],
      offers: async () => [offer, { ...offer, id: 'o2' }, { ...offer, id: 'o3', status: 'declined' }],
      covered: 'find_trip',
    });
    expect(await screen.findByText('2 ta taklif')).toBeTruthy();
    expect(tileOf('Soʻrov qoldirish')?.textContent).toContain('2');
    await tap('2 ta taklif');
    expect(screen.getByText(linkOf({ name: OFFER_LINK, id: offer.id }))).toBeTruthy();
  });

  it('counts the live bookings on «Mening safarlarim» and opens the profile', async () => {
    const { tracked } = renderHome(
      (go) => <PassengerHome go={go} />,
      live(PASSENGER_ACTIONS, useBookingsLive),
      {
        bookings: async () => [booking, { ...booking, id: 'b2', status: 'cancelled' }],
        covered: 'find_trip',
      },
    );
    await screen.findByText('Javob kutilmoqda');
    expect(tileOf('Mening safarlarim')?.querySelector('.home-tile-badge')?.textContent).toBe('1');
    await tap('Rasm va sozlamalar');
    expect(tracked).toContainEqual(expect.objectContaining({ name: 'screen_open', screen: 'profile' }));
  });
});

const driver = (status: 'approved' | 'pending' = 'approved') =>
  renderHome(
    (go) => <DriverHome go={go} />,
    live(DRIVER_ACTIONS, useDriverTripsLive),
    {
      trips: async () => [trip],
      requests: async () => [booking, { ...booking, id: 'b2' }],
      wallet: async () => wallet,
      ...(status === 'approved' ? { covered: 'new_trip' } : {}),
    },
    { ...approved, application: { ...approved.application, status } },
  );

describe('the tiles of a driver (G53)', { timeout: 20_000 }, () => {
  it('counts the new requests and opens «Hamyon» with its bonus', async () => {
    driver();
    expect(await screen.findByText('Bonus 481 000 soʻm')).toBeTruthy();
    expect(tileOf('Mening safarlarim')?.querySelector('.home-tile-badge')?.textContent).toBe('2');
    await tap('Hamyon');
    expect(screen.getByText('opened empty')).toBeTruthy();
  });

  it('opens the support bot while the application is checked', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    driver('pending');
    await tap('Savolingiz boʻlsa yozing');
    expect(open.mock.calls[0]?.[0]).toBe(`https://t.me/${loadBrand().bots.support}`);
    expect(screen.queryByText('Hamyon')).toBeNull();
    open.mockRestore();
  });
});
