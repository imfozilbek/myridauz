import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { wallet } from '../bookings/booking-test-kit';
import { StartFlow } from '../flow/start-flow';
import { DriverData } from '../home/driver-data';
import { DRAFT_ACTIONS, DRIVER_ACTIONS } from '../home/home-test-actions';
import { approved } from '../home/home-test-kit';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { DriverContext, type Driver } from './driver-context';
import { DriverNotice } from './driver-notice';

const as = (status: Driver['application']['status']): Driver => ({
  ...approved,
  application: { ...approved.application, status },
});

const render = (driver: Driver) =>
  renderMarket(
    <DriverContext.Provider value={driver}>
      <DriverData>
        <StartFlow
          actions={driver.application.status === 'draft' ? DRAFT_ACTIONS : DRIVER_ACTIONS}
          notice={<DriverNotice />}
        />
      </DriverData>
    </DriverContext.Provider>,
    testClients({ wallet: { mine: async () => wallet } }),
  );

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const tileOf = (title: string) => screen.getByText(title).closest('button');

describe('the main screen of a driver around the check (docs/86 V7, G62 mockup g62/1, G66)', () => {
  it('before the application: the big tile «Haydovchi boʻlish», the waiting tiles pale', () => {
    render({ ...approved, application: { ...approved.application, status: 'draft', car: null } });
    expect(tileOf('Haydovchi boʻlish')?.className).toBe('main-tile');
    expect(screen.getByText('2 qadam: mashina va uning rasmlari')).toBeTruthy();
    expect(tileOf('Safar eʼlon qilish')?.className).toContain('home-tile-pale');
    expect(tileOf('Yoʻlovchilar soʻrovlari')?.className).toContain('home-tile-pale');
  });

  it('while it is checked: the note with the clock stays, no «Yopish» (mockup g66/2 phone 1)', () => {
    const { container } = render(as('pending'));
    expect(screen.getByText('Arizangiz tekshirilmoqda')).toBeTruthy();
    expect(screen.getByText('Odatda 30 daqiqagacha. Javob botga keladi.')).toBeTruthy();
    expect(container.querySelector('.pending-note .lucide-clock')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Yopish' })).toBeNull();
    expect(tileOf('Yoʻlovchilar soʻrovlari')?.className).not.toContain('home-tile-pale');
  });

  it('approved: «Siz haydovchisiz!» with a tick once, with the bonus', async () => {
    const { container } = render(approved);
    expect(await screen.findByText(/^Hamyoningizda 481.000.soʻm bonus\.$/u)).toBeTruthy();
    expect(screen.getByText('Siz haydovchisiz!')).toBeTruthy();
    expect(container.querySelector('.home-note .lucide-check')).toBeTruthy();
    expect(screen.queryByText('Arizangiz tekshirilmoqda')).toBeNull();
    cleanup();
    render(approved);
    expect(screen.queryByText('Siz haydovchisiz!')).toBeNull();
  });
});
