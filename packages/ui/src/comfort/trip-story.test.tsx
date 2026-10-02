import { ApiError } from '@platform/api-client';
import type { Trip } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap, trip } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { testClients } from '../test-shell';
import { DriverShare } from './driver-share';

const story = vi.hoisted(() => ({ canShareStory: vi.fn(() => true), openStory: vi.fn() }));
vi.mock('../telegram/story', () => story);
const picture = vi.hoisted(() => ({ drawStory: vi.fn(async () => new Blob(['x'], { type: 'image/jpeg' })) }));
vi.mock('./story-picture', () => picture);

const STORY = { imageUrl: 'https://api.test/stories/t1?v=1', bookLink: 'https://t.me/bot?startapp=trip_t1' };

const render = (shown: Trip, putTripStory = vi.fn(async () => STORY)) => ({
  putTripStory,
  ...renderMarket(
    <PlacesGate>
      <DriverShare trip={shown} />
    </PlacesGate>,
    testClients({ chat: { putTripStory } }),
  ),
});

afterEach(cleanup);

describe('«Hikoyaga joylash» (docs/88 L19)', () => {
  it('draws the route, sends the picture and opens the story editor of Telegram', async () => {
    const { putTripStory, tracked } = render(trip);
    await tap('Hikoyaga joylash');
    await vi.waitFor(() => expect(story.openStory).toHaveBeenCalled());
    const [texts] = picture.drawStory.mock.calls[0] as unknown as [
      { readonly price: string; readonly button: string },
    ];
    expect(texts.button).toBe('Joy band qilish');
    expect(putTripStory).toHaveBeenCalledWith('t1', expect.any(Blob));
    const [url, caption, link] = story.openStory.mock.calls[0] as [string, string, { url: string }];
    expect(url).toBe(STORY.imageUrl);
    expect(caption).toContain(STORY.bookLink);
    expect(caption.length).toBeLessThanOrEqual(200);
    expect(link.url).toBe(STORY.bookLink);
    expect(tracked.map((event) => event.name)).toContain('driver_trip_story');
  });

  it('says why the story failed and hides for a full trip', async () => {
    render(
      trip,
      vi.fn(async () => Promise.reject(new ApiError(409, 'shares.wrong_status'))),
    );
    await tap('Hikoyaga joylash');
    expect(await screen.findByText('Bu safarni endi ulashib boʻlmaydi.')).toBeTruthy();
    cleanup();
    render({ ...trip, status: 'full' });
    expect(screen.queryByText('Hikoyaga joylash')).toBeNull();
  });
});
