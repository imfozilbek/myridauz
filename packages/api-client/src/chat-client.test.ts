import { describe, expect, it, vi } from 'vitest';
import { createChatClient } from './chat-client';
import type { Fetch } from './fetch';

describe('«Hikoyaga joylash» (docs/88 L19)', () => {
  it('sends the picture of a trip and reads where Telegram takes it', async () => {
    const story = { imageUrl: 'https://api.test/stories/t1', bookLink: 'https://t.me/bot?startapp=trip_t1' };
    const fetch = vi.fn<Fetch>(async () => Response.json(story, { status: 201 }));
    const client = createChatClient({ baseUrl: 'https://api.test', fetch, app: 'driver', initData: 'a=1' });
    const image = new Blob(['x'], { type: 'image/jpeg' });
    expect(await client.putTripStory('t1', image)).toEqual(story);
    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.test/driver/trips/t1/story');
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({ method: 'PUT', body: image });
  });
});
