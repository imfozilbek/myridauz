import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { testClients } from '../test-shell';
import { renderMarket } from './market-test-kit';
import { MyRequestsScreen } from './my-requests-screen';

afterEach(cleanup);

// G90 WALK-2: the open tab says so to TalkBack and VoiceOver, not only by a bold word.
describe('the tabs of «Mening safarlarim»', () => {
  it('mark the open tab as selected', async () => {
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings: async () => [], myOffers: async () => [] },
      }),
    );
    const active = await screen.findByRole('tab', { name: /^Faol/u });
    const past = screen.getByRole('tab', { name: /^Oʻtgan/u });
    expect([active.getAttribute('aria-selected'), past.getAttribute('aria-selected')]).toEqual([
      'true',
      'false',
    ]);
    fireEvent.click(past);
    expect(past.getAttribute('aria-selected')).toBe('true');
  });
});
