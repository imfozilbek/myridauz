import { ApiError, type ChatClient } from '@platform/api-client';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TRIP_DAY, confirmed } from '../bookings/booking-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { FollowScreen } from './follow-screen';

afterEach(cleanup);

import { TOKEN, TRIP } from './follow-test-kit';

describe('close people follow a shared trip (docs/43)', () => {
  it('see the trip without registration and ask for bot messages', async () => {
    const follow = vi.fn<ChatClient['follow']>(async () => undefined);
    const { tracked } = renderMarket(
      <FollowScreen token={TOKEN} onJoin={() => undefined} />,
      testClients({ chat: { sharedTrip: async () => TRIP, follow } }),
    );
    expect(await screen.findByText(/^Dilnozaning safari · /u)).toBeTruthy();
    expect(screen.getByText('Mashinaga chiqdi')).toBeTruthy();
    expect(screen.getByRole('img', { name: '01 A 123 BC' })).toBeTruthy();
    // Where the passenger boards and gets off (the owner, docs/111 Q1).
    expect(screen.getByText('Uchrashuv joyi')).toBeTruthy();
    expect(screen.getByText('Tushirish joyi')).toBeTruthy();
    await tap('Xabar olish');
    expect(await screen.findByText('Xabarlar yoqildi')).toBeTruthy();
    expect(follow).toHaveBeenCalledWith(TOKEN);
    expect(tracked.map((event) => event.name)).toEqual(
      expect.arrayContaining(['share_opened', 'share_follow']),
    );
  });

  it('say why «Xabar olish» failed, when five people already follow and when the link is closed', async () => {
    // A lost network says so and keeps the button for one more try (G43, docs/65 B3).
    const follow = vi
      .fn<ChatClient['follow']>()
      .mockRejectedValueOnce(new ApiError(0, 'network.failed'))
      .mockRejectedValueOnce(new ApiError(409, 'shares.too_many'));
    renderMarket(
      <FollowScreen token={TOKEN} onJoin={() => undefined} />,
      testClients({ chat: { sharedTrip: async () => TRIP, follow } }),
    );
    await tap('Xabar olish');
    expect((await screen.findByRole('alert')).textContent).not.toBe('');
    await tap('Xabar olish');
    expect(await screen.findByText('Bu safarni allaqachon 5 kishi kuzatmoqda.')).toBeTruthy();
    cleanup();
    const closed = vi.fn<ChatClient['sharedTrip']>(async () => {
      throw new ApiError(404, 'shares.not_found');
    });
    renderMarket(
      <FollowScreen token={TOKEN} onJoin={() => undefined} />,
      testClients({ chat: { sharedTrip: closed } }),
    );
    expect(await screen.findByText('Bu safar endi koʻrinmaydi')).toBeTruthy();
  });
});

describe('the passenger shares the trip; in the car by the driver «Keldi» (docs/43, G76)', () => {
  it('sends the card, tells about the arrival and stops sharing', async () => {
    vi.setSystemTime(TRIP_DAY);
    const share = vi.fn<ChatClient['share']>(async () => ({
      preparedMessageId: null,
      link: 'https://t.me/x',
    }));
    const inCar = { ...confirmed, boardedAt: TRIP_DAY };
    const arrived = vi.fn<ChatClient['arrived']>(async () => ({ ...inCar, arrivedAt: TRIP_DAY }));
    const stopSharing = vi.fn<ChatClient['stopSharing']>(async () => undefined);
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings: async () => [inCar], myOffers: async () => [] },
        chat: { share, arrived, stopSharing },
      }),
    );
    await tap('Jasur');
    await tap('Yaqinlarimga');
    expect(share).toHaveBeenCalledWith(confirmed.id);
    await vi.waitFor(() => expect(open.mock.calls[0]?.[0]).toContain('t.me/share/url'));
    await tap('Yetib keldim');
    expect(await screen.findByText('Yaqinlaringizga xabar berildi')).toBeTruthy();
    expect(screen.queryByText('Yetib keldim')).toBeNull();
    await tap('Ulashishni toʻxtatish');
    expect(await screen.findByText('Ulashish toʻxtatildi')).toBeTruthy();
    expect(stopSharing).toHaveBeenCalledWith(confirmed.id);
    expect(screen.queryByText('Ulashishni toʻxtatish')).toBeNull();
    await tap('Yaqinlarimga');
    expect(await screen.findByText('Ulashishni toʻxtatish')).toBeTruthy();
  });
});
