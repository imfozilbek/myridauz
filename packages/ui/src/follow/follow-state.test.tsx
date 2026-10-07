import type { SharedTrip } from '@platform/contracts';
import { cleanup, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { FollowScreen } from './follow-screen';

afterEach(cleanup);

const TRIP: SharedTrip = {
  passengerName: 'Madina',
  from: '1726269',
  to: '1730401',
  departAt: Date.parse('2026-10-02T03:00:00Z'),
  firstDepartAt: Date.parse('2026-10-02T03:00:00Z'),
  km: 320,
  driver: { firstName: 'Jasur', car: { make: 'Chevrolet', model: 'Cobalt', color: 'white' } },
  plate: '01A123BC',
  meetingPoint: { lat: 41.3, lng: 69.2 },
  dropoffPoint: { lat: 39.65, lng: 66.97 },
  status: 'on_the_way',
  followers: 1,
};

const open = (trip: SharedTrip = TRIP) =>
  renderMarket(
    <FollowScreen token={'a'.repeat(43)} onJoin={() => undefined} />,
    testClients({ chat: { sharedTrip: async () => trip } }),
  );

describe('the screen of the close people (G60, mockup g60/3)', () => {
  it('says big where the person is and when they arrive, with three steps', async () => {
    open();
    expect(await screen.findByText('Madina yoʻlda')).toBeTruthy();
    expect(screen.getByText(/^Fargʻona shahriga ≈ \d{2}:\d{2} da yetadi$/u)).toBeTruthy();
    const steps = within(screen.getByRole('list', { name: 'Holati' })).getAllByRole('listitem');
    expect(steps.map((step) => step.dataset.done)).toEqual(['true', 'true', 'false']);
  });

  it('shows the driver with the plate, the two places and «Xabar olish»', async () => {
    open();
    expect(await screen.findByText('01 A 123 BC')).toBeTruthy();
    expect(screen.getByText('Uchrashuv joyi')).toBeTruthy();
    expect(screen.getByText('Tushirish joyi')).toBeTruthy();
    expect(screen.getByText('Xabar olish')).toBeTruthy();
    expect(screen.getByText('Men ham yoʻlga chiqaman')).toBeTruthy();
  });

  it('tells a cancelled trip plainly, without the way (docs/124 И)', async () => {
    open({ ...TRIP, status: 'cancelled' });
    expect(await screen.findByText('Safar bekor qilindi')).toBeTruthy();
    expect(screen.queryByText(/da yetadi$/u)).toBeNull();
  });

  it('says when the driver moved the time and shows no arrival before the trip (docs/124 И)', async () => {
    open({ ...TRIP, status: 'waiting', firstDepartAt: TRIP.departAt - 60 * 60 * 1000 });
    expect(await screen.findByText(/^Vaqt oʻzgardi: \d{2}:\d{2} → \d{2}:\d{2}$/u)).toBeTruthy();
  });

  it('once arrived, says where and when, and that the following ends (mockup g60/6)', async () => {
    open({ ...TRIP, status: 'arrived' });
    expect(await screen.findByText('Madina yetib keldi')).toBeTruthy();
    expect(screen.queryByText(/yetadi$/u)).toBeNull();
    expect(screen.getByText(/^Fargʻona shahri · \d\d:\d\d$/u)).toBeTruthy();
    expect(screen.getByText(/^Kuzatish tugadi:/u)).toBeTruthy();
    expect(screen.queryByText('Xabar olish')).toBeNull();
  });
});
