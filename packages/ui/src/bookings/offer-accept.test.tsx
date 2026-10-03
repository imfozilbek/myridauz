import type { BookingsClient, ChatClient } from '@platform/api-client';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { offer, request } from './booking-test-kit';

afterEach(cleanup);

describe('a passenger takes an offer of a driver (docs/09)', () => {
  it('accepts a driver offer on the own request', async () => {
    const answerOffer = vi.fn<BookingsClient['answerOffer']>(async () => ({
      ...offer,
      status: 'accepted',
      bookingId: 'b1',
    }));
    const share = vi.fn<ChatClient['share']>(async () => ({
      preparedMessageId: null,
      link: 'https://t.me/x',
    }));
    vi.spyOn(window, 'open').mockReturnValue(null);
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [request] },
        bookings: { myBookings: async () => [], myOffers: async () => [offer], answerOffer },
        chat: { share },
      }),
    );
    await tap('bir joy uchun');
    expect(screen.getByText('Haydovchilardan takliflar')).toBeTruthy();
    await tap('Jasur');
    await tap('Qabul qilish');
    expect(await screen.findByText('Joyingiz tasdiqlandi')).toBeTruthy();
    expect(answerOffer).toHaveBeenCalledWith('o1', 'accept');
    // The card for the close people is the second button (docs/89 P9).
    await tap('Yaqinlarimga yuborish');
    await vi.waitFor(() => expect(share).toHaveBeenCalledWith('b1'));
  });
});
