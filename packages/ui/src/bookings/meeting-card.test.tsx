import { loadBrand } from '@platform/brands';
import type { ChatClient } from '@platform/api-client';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { testClients } from '../test-shell';
import { confirmed } from './booking-test-kit';

const MEET_BEFORE_MINUTES = loadBrand().schedule.meetMinutes;

afterEach(cleanup);

const MINUTE = 60 * 1000;
const open = (came: ChatClient['came']) =>
  renderMarket(
    <MyRequestsScreen onBack={() => undefined} />,
    testClients({
      market: { myRequests: async () => [] },
      bookings: { myBookings: async () => [confirmed], myOffers: async () => [] },
      chat: { came },
    }),
  );

describe('the meeting card on the trip day (docs/126, G60)', () => {
  // The card of the block at the bottom, one component; the driver is in it (G78 sheet 2).
  it('shows the meeting before the departure; «Men keldim» tells the driver', async () => {
    vi.setSystemTime(confirmed.trip.departAt - (MEET_BEFORE_MINUTES - 10) * MINUTE);
    const came = vi.fn<ChatClient['came']>(async () => ({ ...confirmed, cameAt: Date.now() }));
    open(came);
    await tap('Jasur');
    expect(document.querySelector('.meeting-block .dock-card-soon')).toBeTruthy();
    expect(document.querySelector('.booking-card .driver-row')).toBeNull();
    expect(screen.getByRole('button', { name: 'Xaritada ochish' })).toBeTruthy();
    await tap('Men keldim');
    expect(came).toHaveBeenCalledWith(confirmed.id);
    await waitFor(() => expect(screen.queryByText('Men keldim')).toBeNull());
    expect(screen.getByRole('button', { name: 'Xaritada ochish' }).className).toBe('meeting-main');
  });

  it('is not there earlier', async () => {
    vi.setSystemTime(confirmed.trip.departAt - (MEET_BEFORE_MINUTES + 10) * MINUTE);
    open(vi.fn());
    await tap('Jasur');
    expect(screen.queryByText('Men keldim')).toBeNull();
    expect(document.querySelector('.booking-card .driver-row')).toBeTruthy();
  });
});
