import { cleanup, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { SubscribeLink } from '../subscriptions/subscribe-link';
import { startParam } from '../telegram/launch-param';
import { testClients } from '../test-shell';
import { FindLink } from './find-link';
import { renderMarket, trip } from './market-test-kit';
import { TripLink } from './trip-link';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

const clients = testClients({ market: { trip: async () => trip, searchTrips: async () => [] } });
type Link = (props: { readonly enabled: boolean; readonly children: ReactNode }) => ReactNode;
// The gates above the links mount them again (registration, a new session): the link stays used.
async function openTwice(Link: Link, shown: string | RegExp) {
  const first = renderMarket(
    <Link enabled>
      <p>Asosiy</p>
    </Link>,
    clients,
  );
  expect(await screen.findByText(shown)).toBeTruthy();
  first.unmount();
  renderMarket(
    <Link enabled>
      <p>Asosiy</p>
    </Link>,
    clients,
  );
  expect(screen.getByText('Asosiy')).toBeTruthy();
}

describe('a link from a bot or a channel opens once (docs/94 B10)', () => {
  it('a trip of a channel post; the start parameter stays for the source of the launch', async () => {
    window.history.replaceState(null, '', `/?tgWebAppStartParam=trip_${trip.id}`);
    await openTwice(TripLink, 'Joy band qilish');
    expect(startParam()).toBe(`trip_${trip.id}`);
  });

  it('a trip of a bot message', async () => {
    window.history.replaceState(null, '', `/?trip=${trip.id}`);
    await openTwice(TripLink, 'Joy band qilish');
    expect(window.location.search).toBe('');
  });

  it('a route of a channel post to subscribe', async () => {
    window.history.replaceState(null, '', '/#tgWebAppStartParam=sub_1726_1730_2020-01-01');
    await openTwice(SubscribeLink, /^Faqat/u);
  });

  it('a search of the landing', async () => {
    window.history.replaceState(null, '', '/#tgWebAppStartParam=find_9999_1730');
    await openTwice(FindLink, 'Qayerdan');
  });
});
