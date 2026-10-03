import { cleanup, fireEvent, screen } from '@testing-library/react';
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
    hintKey: 'common.driver.newTripHint',
    waitsApproval: true,
  },
  {
    id: 'my_trips',
    icon: 'myTrips',
    tone: 'deep',
    labelKey: 'common.myTrips',
    hintKey: 'common.driver.myTripsHint',
  },
];
const pending: Driver = { ...approved, application: { ...approved.application, status: 'pending' } };

const render = (driver: Driver) =>
  renderMarket(
    <DriverContext.Provider value={driver}>
      <StartFlow actions={ACTIONS} notice={<DriverNotice />} />
    </DriverContext.Provider>,
    testClients({ wallet: { mine: async () => wallet } }),
  );

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('the main screen of a driver around the check (docs/86 V7)', () => {
  it('marks the actions that wait for the approval, and keeps the others as they are', () => {
    render(pending);
    expect(screen.getByText('Ariza tekshirilmoqda')).toBeTruthy();
    // A note with its own «Yopish», not a row of the list (docs/88 L11).
    fireEvent.click(screen.getByRole('button', { name: 'Yopish' }));
    expect(screen.queryByText('Ariza tekshirilmoqda')).toBeNull();
    expect(screen.getByText('Tasdiqlangandan keyin')).toBeTruthy();
    // Only the action that waits has a muted icon.
    expect(document.querySelectorAll('.action-waiting')).toHaveLength(1);
    expect(screen.getByText('Tasdiqlangandan keyin').closest('[role="button"]')?.textContent).toContain(
      'Safar eʼlon qilish',
    );
  });

  it('says once that the application is approved, with the bonus and its last day (docs/89 D4)', async () => {
    render(approved);
    // The banner comes whole with its bonus, it never grows under the eyes (G41, docs/108).
    const bonus = await screen.findByText(/bonus berdik/);
    expect(screen.getByText('Ariza tasdiqlandi')).toBeTruthy();
    expect(bonus.textContent).toContain('481\u00a0000\u00a0soʻm');
    expect(bonus.textContent).toContain('31-oktabrgacha');
    expect(screen.queryByText('Tasdiqlangandan keyin')).toBeNull();
    cleanup();
    render(approved);
    expect(screen.queryByText('Ariza tasdiqlandi')).toBeNull();
  });
});
