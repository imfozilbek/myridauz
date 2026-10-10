import { ApiError } from '@platform/api-client';
import { DAY_MS, type Booking, type Trip } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { openOwnTrip, recommendation, renderMarket, tap, trip } from '../market/market-test-kit';
import { MyTripsScreen } from '../market/my-trips-screen';
import { testClients } from '../test-shell';

const story = vi.hoisted(() => ({ canShareStory: vi.fn(() => true), openStory: vi.fn() }));
vi.mock('../telegram/story', () => story);
const picture = vi.hoisted(() => ({ drawStory: vi.fn(async () => new Blob(['x'], { type: 'image/jpeg' })) }));
vi.mock('../comfort/story-picture', () => picture);

const STORY = { imageUrl: 'https://api.test/stories/t1?v=1', bookLink: 'https://t.me/bot?startapp=trip_t1' };

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function open(shown: Trip, chat: object = {}, bookings: readonly Booking[] = []) {
  const rendered = renderMarket(
    <MyTripsScreen onBack={() => undefined} />,
    testClients({
      market: { myTrips: async () => [shown], recommend: async () => recommendation },
      bookings: { driverBookings: async () => [...bookings], driverOffers: async () => [] },
      chat,
    }),
  );
  await openOwnTrip();
  await screen.findByText('Yaqinlarimga');
  return rendered;
}

describe('«Yaqinlarimga» of the driver (docs/43, G18)', () => {
  it('sends the trip to the family, stops sharing, and says why a left trip cannot go', async () => {
    vi.stubGlobal('open', vi.fn());
    const shareTrip = vi.fn(async () => ({
      preparedMessageId: null,
      link: 'https://t.me/bot?start=follow_x',
    }));
    const stopTripSharing = vi.fn(async () => undefined);
    const { tracked } = await open(trip, { shareTrip, stopTripSharing });
    await tap('Yaqinlarimga');
    expect(shareTrip).toHaveBeenCalledWith('t1');
    expect(await screen.findByText('Yaqinlaringizga xabar berildi')).toBeTruthy();
    expect(tracked.map((event) => event.name)).toContain('driver_trip_shared');
    await tap('Ulashishni toʻxtatish');
    expect(stopTripSharing).toHaveBeenCalledWith('t1');
    expect(await screen.findByText('Ulashish toʻxtatildi')).toBeTruthy();
    shareTrip.mockRejectedValueOnce(new ApiError(409, 'shares.wrong_status'));
    await tap('Yaqinlarimga');
    expect(await screen.findByText('Bu safarni endi ulashib boʻlmaydi.')).toBeTruthy();
  });
});

describe('«Hikoyaga» (docs/88 L19)', () => {
  it('draws the route, sends the picture and opens the story editor of Telegram', async () => {
    const putTripStory = vi.fn(async () => STORY);
    const { tracked } = await open(trip, { putTripStory });
    await tap('Hikoyaga');
    await vi.waitFor(() => expect(story.openStory).toHaveBeenCalled());
    const [texts] = picture.drawStory.mock.calls[0] as unknown as [{ readonly button: string }];
    expect(texts.button).toBe('Joy band qilish');
    expect(putTripStory).toHaveBeenCalledWith('t1', expect.any(Blob));
    const [url, caption, link] = story.openStory.mock.calls[0] as [string, string, { url: string }];
    expect(url).toBe(STORY.imageUrl);
    expect(caption).toContain(STORY.bookLink);
    expect(caption.length).toBeLessThanOrEqual(200);
    expect(link.url).toBe(STORY.bookLink);
    expect(tracked.map((event) => event.name)).toContain('driver_trip_story');
  });

  it('a trip on the road goes to no story, and says why', async () => {
    await open({ ...trip, departAt: Date.now() - 60 * 1000 });
    await tap('Hikoyaga');
    expect(await screen.findByText('Yoʻlga chiqqan safarni hikoyaga joylab boʻlmaydi.')).toBeTruthy();
    expect(story.openStory).not.toHaveBeenCalled();
  });

  it('stays and says why: a full trip, an old Telegram, a failed upload', async () => {
    await open({ ...trip, status: 'full' });
    await tap('Hikoyaga');
    expect(await screen.findByText('Hikoyaga faqat boʻsh joyi bor safar joylanadi.')).toBeTruthy();
    cleanup();
    story.canShareStory.mockReturnValueOnce(false);
    await open(trip);
    await tap('Hikoyaga');
    expect(await screen.findByText('Hikoyaga joylash uchun Telegramni yangilang.')).toBeTruthy();
    cleanup();
    await open(trip, { putTripStory: async () => Promise.reject(new ApiError(409, 'shares.wrong_status')) });
    await tap('Hikoyaga');
    expect(await screen.findByText('Bu safarni endi ulashib boʻlmaydi.')).toBeTruthy();
  });
});

describe('«Vaqt yoki narx» and «Yoʻl xaritasi» (mockup g63/3)', () => {
  it('opens the two changes of G39 to choose from', async () => {
    await open(trip);
    await tap('Vaqt yoki narx');
    expect(await screen.findByText('Vaqtni surish')).toBeTruthy();
    await tap('Narxni tushirish');
    expect(await screen.findByText(/^Faqat pastga\./u)).toBeTruthy();
  });

  it('a trip on the road keeps its time and price, and says so', async () => {
    await open({ ...trip, departAt: Date.now() - 60 * 1000 });
    await tap('Vaqt yoki narx');
    expect(await screen.findByText('Yoʻlga chiqqan safarning vaqti va narxi oʻzgarmaydi.')).toBeTruthy();
  });

  it('a trip that left early keeps its time and price too (G63 B1)', async () => {
    const left = { ...trip, departedAt: Date.now() - 60 * 1000 };
    await open(left);
    await tap('Vaqt yoki narx');
    expect(await screen.findByText('Yoʻlga chiqqan safarning vaqti va narxi oʻzgarmaydi.')).toBeTruthy();
  });

  it('the map waits for a confirmed passenger, then opens', async () => {
    await open(trip);
    await tap('Yoʻl xaritasi');
    expect(await screen.findByText('Hali tasdiqlangan yoʻlovchi yoʻq.')).toBeTruthy();
    cleanup();
    await open(trip, {}, [confirmed]);
    await tap('Yoʻl xaritasi');
    expect(await screen.findByText(/ · \d+ yoʻlovchi$/u)).toBeTruthy();
  });
});

describe('an over trip keeps its four tiles, each says how the trip ended (docs/121)', () => {
  const note = () => document.querySelector('.own-note')?.textContent;

  it('a cancelled trip', async () => {
    await open({ ...trip, status: 'cancelled' }, {}, [confirmed]);
    for (const tile of ['Yaqinlarimga', 'Hikoyaga', 'Vaqt yoki narx', 'Yoʻl xaritasi']) {
      await tap(tile);
      expect(note()).toBe('Safar bekor qilindi');
    }
  });

  it('a trip whose time ended before the list is fresh (an arrived one is the past trip)', async () => {
    await open({ ...trip, departAt: Date.now() - DAY_MS }, {}, [{ ...confirmed, status: 'completed' }]);
    for (const tile of ['Yoʻl xaritasi', 'Vaqt yoki narx']) {
      await tap(tile);
      expect(note()).toBe('Safar tugadi');
    }
  });
});
