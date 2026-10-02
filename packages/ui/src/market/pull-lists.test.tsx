import { cleanup, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { wallet } from '../bookings/booking-test-kit';
import { ChannelsScreen } from '../channels/channels-screen';
import { FavoritesScreen } from '../comfort/favorites-screen';
import { HistoryScreen } from '../comfort/history-screen';
import { DriverHome } from '../home/driver-home';
import { PassengerHome } from '../home/passenger-home';
import { PitaksScreen } from '../pitaks/pitaks-screen';
import { SubscriptionsScreen } from '../subscriptions/subscriptions-screen';
import { testClients } from '../test-shell';
import { TeamWalletsScreen } from '../wallet/team-wallets-screen';
import { WalletScreen } from '../wallet/wallet-screen';
import { pullDown } from './list-test-kit';
import { renderMarket } from './market-test-kit';
import { RequestsSearchFlow } from './requests-search-flow';
import { TeamTripsScreen } from './team-trips-screen';

afterEach(cleanup);

const back = () => undefined;
const go = () => undefined;
const place = (id: string, parentId: string, name: string) =>
  ({ id, parentId, type: 'district', name, lat: 41, lng: 69, oneCity: false }) as const;
const route = {
  from: place('1726269', '1726', 'Chilonzor'),
  to: place('1730401', '1730', 'Fargʻona shahri'),
};

type Case = readonly [string, ReactNode, (load: () => Promise<never>) => Parameters<typeof testClients>[0]];
const empty = async () => [];
// Each list gets data of its own shape, an empty list by default.
const CASES: readonly Case[] = [
  ['passenger home', <PassengerHome go={go} />, (load) => ({ bookings: { myBookings: load } })],
  [
    'driver home',
    <DriverHome go={go} />,
    (load) => ({ market: { myTrips: load }, bookings: { driverBookings: empty } }),
  ],
  ['favorites', <FavoritesScreen onBack={back} />, (load) => ({ comfort: { favorites: load } })],
  ['history', <HistoryScreen onBack={back} />, (load) => ({ comfort: { history: load } })],
  ['wallet', <WalletScreen onBack={back} />, (load) => ({ wallet: { mine: load } })],
  ['team wallets', <TeamWalletsScreen onBack={back} />, (load) => ({ wallet: { all: load } })],
  ['channels', <ChannelsScreen onBack={back} />, (load) => ({ channels: { list: load } })],
  ['pitaks', <PitaksScreen onBack={back} />, (load) => ({ pitaks: { all: load } })],
  ['team trips', <TeamTripsScreen onBack={back} />, (load) => ({ market: { teamTrips: load } })],
  [
    'requests of a day',
    <RequestsSearchFlow onBack={back} initial={{ route, date: '2026-10-02' }} />,
    (load) => ({ market: { searchRequests: load } }),
  ],
  ['subscriptions', <SubscriptionsScreen onBack={back} />, (load) => ({ subscriptions: { mine: load } })],
];
const DATA: Record<string, unknown> = {
  favorites: { drivers: [], trips: [] },
  wallet,
  pitaks: { directions: [], pitaks: [] },
};

describe('A pull down at the top of a list refreshes it (docs/94 W1)', { timeout: 20_000 }, () => {
  it.each(CASES)('%s', async (name, ui, clients) => {
    const load = vi.fn(async (): Promise<never> => (DATA[name] ?? []) as never);
    renderMarket(
      ui,
      testClients({ ...clients(load), map: { where: async () => Promise.reject(new Error('none')) } }),
    );
    await waitFor(() => expect(load).toHaveBeenCalled());
    await waitFor(() => expect(document.querySelector('[aria-busy="true"]')).toBeNull());
    const before = load.mock.calls.length;
    await pullDown();
    await waitFor(() => expect(load.mock.calls.length).toBeGreaterThan(before));
    expect(screen.queryByText('test.client_not_used')).toBeNull();
  });
});
