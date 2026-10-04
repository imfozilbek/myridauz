import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StartFlow } from '../flow/start-flow';
import type { StartAction } from '../flow/start-action';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import {
  AdminTiles,
  MANAGEMENT_SECTION,
  STATS_SECTION,
  TRIPS_SECTION,
  useApplicationsLive,
  useComplaintsLive,
} from './admin-tiles';

afterEach(cleanup);

const Shown = ({ name }: { readonly name: string }) => <p>{`opened ${name}`}</p>;
const action = (id: string, useLive?: StartAction['useLive']): StartAction => ({
  id,
  icon: 'applications',
  tone: 'brand',
  labelKey: id === 'complaints' ? 'common.admin.complaints' : 'common.admin.applications',
  hintKey: 'common.admin.applicationsHint',
  ...(useLive ? { useLive } : {}),
  Screen: () => <Shown name={id} />,
});
const numbers = {
  newUsers: 24,
  trips: 9,
  activeTrips: 17,
  bookings: 0,
  driverApplications: 0,
  complaints: 0,
};

const admin = (applications: number, complaints: number, statsFail = false) =>
  renderMarket(
    <StartFlow
      actions={[action('applications', useApplicationsLive), action('complaints', useComplaintsLive)]}
      sections={[action(STATS_SECTION), action(TRIPS_SECTION), action(MANAGEMENT_SECTION)]}
      tiles={(go) => <AdminTiles go={go} />}
    />,
    testClients({
      moderation: { queue: async () => Array.from({ length: applications }) as never },
      feedback: { queue: async () => Array.from({ length: complaints }) as never },
      stats: {
        get: async () => (statsFail ? Promise.reject(new Error('down')) : ({ numbers } as never)),
      },
    }),
  );

const valueOf = (title: string) =>
  screen.getByText(title).closest('button')?.querySelector<HTMLElement>('.home-tile-value');

describe('the number tiles of the admin Mini App (G53, variant C)', { timeout: 20_000 }, () => {
  it('says how many applications and complaints wait, red while any waits', async () => {
    admin(3, 0);
    expect(await screen.findByText('24')).toBeTruthy();
    expect(screen.getByText('17')).toBeTruthy();
    expect(valueOf('Arizalar')?.textContent).toBe('3');
    expect(valueOf('Arizalar')?.style.color).not.toBe('');
    expect(valueOf('Shikoyatlar')?.textContent).toBe('0');
    expect(valueOf('Shikoyatlar')?.style.color).toBe('');
  });

  it('opens the day, the trips and «Boshqaruv» from their tiles', async () => {
    admin(0, 0);
    await tap('yangi foydalanuvchi');
    expect(screen.getByText(`opened ${STATS_SECTION}`)).toBeTruthy();
    cleanup();
    admin(0, 0);
    await tap('faol eʼlon');
    expect(screen.getByText(`opened ${TRIPS_SECTION}`)).toBeTruthy();
    cleanup();
    admin(0, 0);
    await tap('Boshqaruv');
    expect(screen.getByText(`opened ${MANAGEMENT_SECTION}`)).toBeTruthy();
  });

  it('keeps the work tiles when the numbers of the day fail', async () => {
    admin(1, 2, true);
    await screen.findByText('kutmoqda');
    expect(valueOf('Shikoyatlar')?.textContent).toBe('2');
    expect(valueOf('Bugun')).toBeNull();
  });
});
