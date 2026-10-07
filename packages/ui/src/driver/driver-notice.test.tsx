import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StartFlow } from '../flow/start-flow';
import type { StartAction } from '../flow/start-action';
import { approved } from '../home/home-test-kit';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { DriverContext, type Driver } from './driver-context';
import { DriverNotice } from './driver-notice';
import { wallet } from '../bookings/booking-test-kit';

const ACTIONS: readonly StartAction[] = [
  {
    id: 'new_trip',
    icon: 'newTrip',
    tone: 'brand',
    labelKey: 'home.publish',
    hintKey: 'home.publishHint',
    waitsApproval: true,
    Screen: () => null,
  },
  {
    id: 'passenger_requests',
    icon: 'passengers',
    tone: 'accent',
    labelKey: 'common.driver.passengerRequests',
    hintKey: 'common.driver.passengerRequestsHint',
    paleUntilApproval: true,
    Screen: () => null,
  },
  {
    id: 'my_trips',
    icon: 'myTrips',
    tone: 'deep',
    labelKey: 'common.myTrips',
    hintKey: 'common.driver.myTripsHint',
    Screen: () => null,
  },
];
const pending: Driver = { ...approved, application: { ...approved.application, status: 'pending' } };

const render = (driver: Driver) =>
  renderMarket(
    <DriverContext.Provider value={driver}>
      <StartFlow
        actions={ACTIONS}
        notice={<DriverNotice />}
        {...(driver.application.status === 'approved' ? { mainTile: 'new_trip' } : {})}
      />
    </DriverContext.Provider>,
    testClients({ wallet: { mine: async () => wallet } }),
  );

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const tileOf = (title: string) => screen.getByText(title).closest('button');

describe('the main screen of a driver around the check (docs/86 V7, G62 mockup g62/1)', () => {
  it('before the application: the big tile «Haydovchi boʻlish», the waiting tiles pale', () => {
    render({ ...approved, application: { ...approved.application, status: 'draft', car: null } });
    expect(tileOf('Haydovchi boʻlish')?.className).toBe('main-tile');
    expect(screen.getByText('2 qadam: mashina va uning rasmlari')).toBeTruthy();
    expect(tileOf('Safar eʼlon qilish')?.className).toContain('home-tile-pale');
  });

  it('while it is checked: the note, publishing and the requests pale, the others as they are', () => {
    render(pending);
    // The amber note stays while the check lasts: no «Yopish» (the mockup of G53).
    expect(screen.getByText('Arizangiz tekshirilmoqda')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Yopish' })).toBeNull();
    expect(tileOf('Safar eʼlon qilish')?.textContent).toContain('Tekshiruvdan keyin');
    expect(tileOf('Safar eʼlon qilish')?.className).toContain('home-tile-pale');
    // The requests keep their hint, only pale (mockup g62/1 screen 4).
    expect(tileOf('Yoʻlovchilar soʻrovlari')?.className).toContain('home-tile-pale');
    expect(tileOf('Yoʻlovchilar soʻrovlari')?.textContent).toContain('Yoʻnalishingizdagi');
    expect(tileOf('Mening safarlarim')?.className).not.toContain('home-tile-pale');
  });

  it('approved: «Siz haydovchisiz!» once with the bonus, then the big tile «Safar eʼlon qilish»', async () => {
    render(approved);
    const bonus = await screen.findByText(/^Hamyoningizda 481.000.soʻm bonus\.$/u);
    expect(screen.getByText('Siz haydovchisiz!')).toBeTruthy();
    const main = tileOf('Safar eʼlon qilish');
    expect(main?.className).toBe('main-tile');
    expect(main?.textContent).toContain('Yoʻlovchilar sizni oʻzi topadi');
    // On top: the note, then the big tile, then the others (mockup g62/1 screen 6).
    expect(bonus.compareDocumentPosition(main as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText('Tekshiruvdan keyin')).toBeNull();
    expect(tileOf('Yoʻlovchilar soʻrovlari')?.className).not.toContain('home-tile-pale');
    cleanup();
    render(approved);
    expect(screen.queryByText('Siz haydovchisiz!')).toBeNull();
  });
});
