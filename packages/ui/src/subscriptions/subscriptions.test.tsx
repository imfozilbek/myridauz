import { ApiError, type SubscriptionsClient } from '@platform/api-client';
import { tashkentDate, type Subscription } from '@platform/contracts';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FindTripFlow } from '../market/find-trip-flow';
import { quickRoute, renderMarket, tap, trip } from '../market/market-test-kit';
import { TripLink } from '../market/trip-link';
import { testClients } from '../test-shell';
import { SubscribeLink } from './subscribe-link';
import { SubscriptionsLink } from './subscriptions-link';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

const ANY: Subscription = {
  id: 's1',
  kind: 'trips',
  from: '1726269',
  to: '1730',
  date: null,
  woman: true,
  expiresAt: Date.parse('2026-10-31T12:00:00Z'),
  expired: true,
};

describe('"Xabar bering" (docs/24)', () => {
  it('subscribes to the searched route for the day or any day', async () => {
    const subscribe = vi.fn<SubscriptionsClient['subscribe']>(async () => ANY);
    const { tracked } = renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { searchTrips: async () => [] }, subscriptions: { subscribe } }),
    );
    await quickRoute();
    await tap('Xabar bering');
    await tap('Istalgan kun');
    expect(await screen.findByText(/Obuna boʻldingiz/)).toBeTruthy();
    expect(subscribe).toHaveBeenCalledWith({ from: '1726269', to: '1730401', date: null, woman: false });
    expect(tracked.some((event) => event.name === 'route_subscribed')).toBe(true);
  });

  it('explains the limit of 5 subscriptions', async () => {
    const subscribe = vi.fn<SubscriptionsClient['subscribe']>(async () => {
      throw new ApiError(409, 'subscriptions.too_many');
    });
    renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { searchTrips: async () => [] }, subscriptions: { subscribe } }),
    );
    await quickRoute();
    await tap('Xabar bering');
    await tap(/^Faqat/);
    expect(await screen.findByText('Obunalar soni chegaraga yetdi. Keraksizini oʻchiring.')).toBeTruthy();
  });
});

describe('"Obunalar" and the links of bots and channels (docs/15, docs/24)', () => {
  it('opens the list from the bot, renews "any date" and deletes', async () => {
    window.history.replaceState(null, '', '/?subscriptions=1');
    let list = [ANY];
    const renew = vi.fn<SubscriptionsClient['renew']>(async () => ({ ...ANY, expired: false }));
    const remove = vi.fn<SubscriptionsClient['remove']>(async () => void (list = []));
    const mine = vi.fn<SubscriptionsClient['mine']>(async () => list);
    const subscribe = vi.fn<SubscriptionsClient['subscribe']>(async () => {
      list = [ANY];
      return ANY;
    });
    renderMarket(
      <SubscriptionsLink>
        <p>Asosiy</p>
      </SubscriptionsLink>,
      testClients({ subscriptions: { mine, renew, remove, subscribe } }),
    );
    expect(await screen.findByText('Obunalar')).toBeTruthy();
    expect(screen.getByText('Muddati tugagan')).toBeTruthy();
    expect(screen.getByText('Mashinada ayol bor')).toBeTruthy();
    await tap('Uzaytirish');
    expect(renew).toHaveBeenCalledWith('s1');
    // The list comes again after a change.
    await waitFor(() => expect(mine).toHaveBeenCalledTimes(2));
    // A removal is red, like in Telegram (docs/86 V12).
    expect(screen.getByText('Oʻchirish').closest('.danger-text')).not.toBeNull();
    // Asked first in the native window; a «no» keeps it (docs/88 L8).
    vi.stubGlobal('confirm', () => false);
    await tap('Oʻchirish');
    expect(remove).not.toHaveBeenCalled();
    vi.stubGlobal('confirm', () => true);
    await tap('Oʻchirish');
    expect(await screen.findByText('Hali obunalar yoʻq')).toBeTruthy();
    vi.unstubAllGlobals();
    // A short line says it is gone and brings it back by one tap (docs/88 L7).
    expect(screen.getByText('Obuna oʻchirildi')).toBeTruthy();
    await tap('Qaytarish');
    expect(subscribe).toHaveBeenCalledWith({ from: ANY.from, to: ANY.to, date: ANY.date, woman: ANY.woman });
    expect(await screen.findByText('Obunalar')).toBeTruthy();
  });

  it('opens the trip of a channel post, ready to book', async () => {
    window.history.replaceState(null, '', `/?tgWebAppStartParam=trip_${trip.id}`);
    const tripOf = vi.fn(async () => trip);
    renderMarket(
      <TripLink enabled>
        <p>Asosiy</p>
      </TripLink>,
      testClients({ market: { trip: tripOf } }),
    );
    expect(await screen.findByText('Joy band qilish')).toBeTruthy();
    expect(tripOf).toHaveBeenCalledWith(trip.id);
    cleanup();
    renderMarket(
      <TripLink enabled={false}>
        <p>Asosiy</p>
      </TripLink>,
      testClients({}),
    );
    expect(screen.getByText('Asosiy')).toBeTruthy();
  });

  it('subscribes to the route of a channel post; an old post gives today', async () => {
    window.history.replaceState(null, '', '/#tgWebAppStartParam=sub_1726_1730_2020-01-01');
    const subscribe = vi.fn<SubscriptionsClient['subscribe']>(async () => ANY);
    renderMarket(
      <SubscribeLink enabled>
        <p>Asosiy</p>
      </SubscribeLink>,
      testClients({ subscriptions: { subscribe } }),
    );
    await tap(/^Faqat/);
    expect(await screen.findByText(/Obuna boʻldingiz/)).toBeTruthy();
    expect(subscribe).toHaveBeenCalledWith({
      from: '1726',
      to: '1730',
      date: tashkentDate(Date.now()),
      woman: false,
    });
  });
});
