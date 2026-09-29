import { ApiError, type ChatClient } from '@platform/api-client';
import type { SharedTrip } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { FollowScreen } from './follow-screen';

afterEach(cleanup);

const TOKEN = 'a'.repeat(43);
const TRIP: SharedTrip = {
  passengerName: 'Dilnoza',
  from: '1726269',
  to: '1730401',
  departAt: Date.parse('2026-10-02T03:00:00Z'),
  km: 320,
  driver: { firstName: 'Jasur', car: { make: 'Chevrolet', model: 'Cobalt', color: 'white' } },
  plate: '01A123BC',
  meetingPoint: { lat: 41.3, lng: 69.2 },
  status: 'boarded',
  followers: 1,
};

describe('close people follow a shared trip (docs/43)', () => {
  it('see the trip without registration and ask for bot messages', async () => {
    const follow = vi.fn<ChatClient['follow']>(async () => undefined);
    const { tracked } = renderMarket(
      <FollowScreen token={TOKEN} />,
      testClients({ chat: { sharedTrip: async () => TRIP, follow } }),
    );
    expect(await screen.findByText('Dilnozaning safari')).toBeTruthy();
    expect(screen.getByText('Mashinaga chiqdi')).toBeTruthy();
    expect(screen.getByText('01 A 123 BC')).toBeTruthy();
    await tap('Xabar olish');
    expect(await screen.findByText('Xabarlar yoqildi')).toBeTruthy();
    expect(follow).toHaveBeenCalledWith(TOKEN);
    expect(tracked.map((event) => event.name)).toEqual(
      expect.arrayContaining(['share_opened', 'share_follow']),
    );
  });

  it('say so when five people already follow, and when the link is closed', async () => {
    const follow = vi.fn<ChatClient['follow']>(async () => {
      throw new ApiError(409, 'shares.too_many');
    });
    renderMarket(
      <FollowScreen token={TOKEN} />,
      testClients({ chat: { sharedTrip: async () => TRIP, follow } }),
    );
    await tap('Xabar olish');
    expect(await screen.findByText('Bu safarni allaqachon 5 kishi kuzatmoqda.')).toBeTruthy();
    cleanup();
    const closed = vi.fn<ChatClient['sharedTrip']>(async () => {
      throw new ApiError(404, 'shares.not_found');
    });
    renderMarket(<FollowScreen token={TOKEN} />, testClients({ chat: { sharedTrip: closed } }));
    expect(await screen.findByText('Bu safar endi koʻrinmaydi')).toBeTruthy();
  });
});

describe('the passenger shares the trip (docs/43)', () => {
  it('sends the card, tells about getting in and stops sharing', async () => {
    const share = vi.fn<ChatClient['share']>(async () => ({
      preparedMessageId: null,
      link: 'https://t.me/x',
    }));
    const boarded = vi.fn<ChatClient['boarded']>(async () => ({ ...confirmed, boardedAt: 5 }));
    const stopSharing = vi.fn<ChatClient['stopSharing']>(async () => undefined);
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings: async () => [confirmed], myOffers: async () => [] },
        chat: { share, boarded, stopSharing },
      }),
    );
    await tap('Jasur');
    await tap('Yaqinlarimga yuborish');
    expect(share).toHaveBeenCalledWith(confirmed.id);
    await vi.waitFor(() => expect(open.mock.calls[0]?.[0]).toContain('t.me/share/url'));
    await tap('Mashinaga chiqdim');
    expect(await screen.findByText('Yaqinlaringizga xabar berildi')).toBeTruthy();
    expect(screen.queryByText('Mashinaga chiqdim')).toBeNull();
    await tap('Ulashishni toʻxtatish');
    expect(await screen.findByText('Ulashish toʻxtatildi')).toBeTruthy();
    expect(stopSharing).toHaveBeenCalledWith(confirmed.id);
  });
});
