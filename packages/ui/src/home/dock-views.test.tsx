import { DAY_MS, tashkentDate } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { request } from '../bookings/booking-test-kit';
import { markApprovalSeen } from '../driver/approval-seen';
import { trip } from '../market/market-test-kit';
import { DriverHome } from './driver-home';
import { DRIVER_ACTIONS, PASSENGER_ACTIONS } from './home-test-actions';
import { approved, renderHome } from './home-test-kit';
import { PassengerHome } from './passenger-home';

beforeEach(markApprovalSeen);
afterEach(cleanup);

// Who saw it, in the block at the bottom (G76): only when somebody did.
describe(
  'the views in the block at the bottom (G76, mockups g76/2 state 4, g76/3 state 6)',
  { timeout: 20_000 },
  () => {
    it('«Soʻrovim» says how many drivers saw the request', async () => {
      const open = { ...request, date: tashkentDate(Date.now() + DAY_MS) };
      renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, {
        bookings: async () => [],
        asked: async () => [{ ...open, views: 14 }],
      });
      expect(await screen.findByText(/ · 14 haydovchi koʻrdi$/u)).toBeTruthy();
      cleanup();
      renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, {
        bookings: async () => [],
        asked: async () => [open],
      });
      expect(await screen.findByText('Soʻrovim')).toBeTruthy();
      expect(screen.queryByText(/koʻrdi$/u)).toBeNull();
    });

    it('a published trip says how many people opened it', async () => {
      const ahead = { ...trip, departAt: Date.now() + 2 * DAY_MS, views: 23 };
      renderHome(
        () => <DriverHome />,
        DRIVER_ACTIONS,
        { trips: async () => [ahead], requests: async () => [], where: true },
        approved,
      );
      expect(await screen.findByText(/ · 23 kishi koʻrdi$/u)).toBeTruthy();
    });
  },
);
