import { ApiError, type ChatClient } from '@platform/api-client';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TRIP_DAY, confirmed } from '../bookings/booking-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { locations, renderMarket, tap } from '../market/market-test-kit';
import { renderInShell, testClients } from '../test-shell';
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

  // G89 U6: a weak network is not a closed link: the close person can try again.
  it('offers «Qayta urinish» when the network failed, and shows the trip after it', async () => {
    const sharedTrip = vi
      .fn<ChatClient['sharedTrip']>()
      .mockRejectedValueOnce(new ApiError(0, 'network.timeout'))
      .mockResolvedValue(TRIP);
    renderMarket(
      <FollowScreen token={TOKEN} onJoin={() => undefined} />,
      testClients({ chat: { sharedTrip } }),
    );
    await tap('Qayta urinish');
    expect(screen.queryByText('Bu safar endi koʻrinmaydi')).toBeNull();
    await waitFor(() => expect(sharedTrip).toHaveBeenCalledTimes(2));
  });
});

describe('the passenger shares the trip; in the car by the driver «Keldi» (docs/43, G76)', () => {
  it('sends the card, tells about the arrival and stops sharing', async () => {
    vi.setSystemTime(TRIP_DAY);
    const share = vi.fn<ChatClient['share']>(async () => ({
      preparedMessageId: null,
      link: 'https://t.me/x',
      text: 'Ali yoʻlga chiqadi',
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
    // The words of the card for an old Telegram (G88, docs/193).
    expect(open.mock.calls[0]?.[0]).toContain(encodeURIComponent('Ali yoʻlga chiqadi'));
    await tap('Yetib keldim');
    expect(await screen.findByText('Yaqinlaringizga xabar berildi')).toBeTruthy();
    expect(screen.queryByText('Yetib keldim')).toBeNull();
    await tap('Ulashishni toʻxtatish');
    expect(await screen.findByText('Ulashish toʻxtatildi')).toBeTruthy();
    expect(stopSharing).toHaveBeenCalledWith(confirmed.id);
    expect(screen.queryByText('Ulashishni toʻxtatish')).toBeNull();
    // After the arrival the ride is over: the page after the trip, nothing to share again (G90 PAS-7).
    expect(screen.getByText('Safar tugadi')).toBeTruthy();
    expect(screen.queryByText('Yaqinlarimga')).toBeNull();
  });

  // G46 (docs/43): the face and the stars of the driver; close people get no signals of a trip that
  // is not theirs, so the screen reads it again while it is open.
  it('show the stars of the driver and the new status without a tap', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const sharedTrip = vi
      .fn<ChatClient['sharedTrip']>()
      .mockResolvedValueOnce(TRIP)
      .mockResolvedValue({ ...TRIP, status: 'on_the_way' });
    renderMarket(
      <FollowScreen token={TOKEN} onJoin={() => undefined} />,
      testClients({ chat: { sharedTrip } }),
    );
    expect(await screen.findByText(/★ 4,9/u)).toBeTruthy();
    vi.advanceTimersByTime(60_000);
    expect(await screen.findByText('Dilnoza yoʻlda')).toBeTruthy();
    vi.useRealTimers();
  });

  // A close person has no account in Rida: the photo of the driver loads all the same (G46).
  it('show the photo of the driver to a close person without an account', async () => {
    // The photo itself is not needed: the call is.
    const getAvatar = vi.fn(() => new Promise<Blob>(() => undefined));
    const clients = testClients({ chat: { sharedTrip: async () => TRIP }, users: { getAvatar } });
    renderInShell(<FollowScreen token={TOKEN} onJoin={() => undefined} />, false, true, locations, clients);
    await waitFor(() => expect(getAvatar).toHaveBeenCalledWith('d1', false));
  });
});
