import type { AppLink } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sheetClosed } from '../home/sheet-closed';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { booking, offer, request } from './booking-test-kit';

// The talk is a screen of its own: here only what «Mening soʻrovim» hands it.
vi.mock('../chat/chat-screen', () => ({
  ChatScreen: ({ onLink }: { readonly onLink?: (link: AppLink) => void }) => (
    <button type="button" onClick={() => onLink?.({ name: 'booking', id: 'b1' })}>
      the offer taken in the talk
    </button>
  ),
}));

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const confirmed = { ...booking, status: 'confirmed' as const, confirmedAt: Date.now(), plate: '01A123BC' };

describe('the talk of an offer (G77, C1)', { timeout: 20_000 }, () => {
  it('an offer taken in its talk opens the seat, as one taken in the sheet', async () => {
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [{ ...request, wholeCar: true }] },
        bookings: { myBookings: async () => [confirmed], myOffers: async () => [offer] },
      }),
    );
    await tap(/· Soʻrov$/u);
    await tap('Jasur');
    await tap('Xabar yozish');
    await tap('the offer taken in the talk');
    expect(await screen.findByText('Joy tasdiqlandi')).toBeTruthy();
    await sheetClosed();
  });
});
