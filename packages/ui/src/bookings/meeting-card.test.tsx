import type { ChatClient } from '@platform/api-client';
import { MEET_BEFORE_MINUTES } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { testClients } from '../test-shell';
import { confirmed } from './booking-test-kit';

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
  it('shows the meeting before the departure; «Men keldim» tells the driver', async () => {
    vi.setSystemTime(confirmed.trip.departAt - (MEET_BEFORE_MINUTES - 10) * MINUTE);
    const came = vi.fn<ChatClient['came']>(async () => ({ ...confirmed, cameAt: Date.now() }));
    open(came);
    await tap('Jasur');
    expect(screen.getByText(/^Uchrashuv · /u)).toBeTruthy();
    await tap('Men keldim');
    expect(came).toHaveBeenCalledWith(confirmed.id);
    expect(await screen.findByText('Haydovchiga aytildi')).toBeTruthy();
  });

  it('is not there earlier', async () => {
    vi.setSystemTime(confirmed.trip.departAt - (MEET_BEFORE_MINUTES + 10) * MINUTE);
    open(vi.fn());
    await tap('Jasur');
    expect(screen.queryByText('Men keldim')).toBeNull();
  });
});
