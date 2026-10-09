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

// The sheet «Yangi xabar» of the open Mini App (G68, docs/122).
describe('the unread chats and a ready answer (G68)', () => {
  it('reads the last words of the unread chats and sends a ready answer without the socket', async () => {
    const key = 'b00000000-0000-4000-8000-000000000001';
    const chats = [{ key, count: 2, text: 'Grand oldida boʻlaman', at: 5 }];
    const fetch = vi.fn<Fetch>(async (url) =>
      String(url).endsWith('/unread') ? Response.json({ chats }) : new Response(null, { status: 204 }),
    );
    const client = createChatClient({ baseUrl: 'https://api.test', fetch, app: 'passenger', initData: 'a=1' });
    expect(await client.unread()).toEqual(chats);
    await client.answer(key, 'Yaxshi');
    expect(fetch.mock.calls[1]?.[0]).toBe(`https://api.test/chats/${key}/messages`);
    expect(fetch.mock.calls[1]?.[1]).toMatchObject({ method: 'POST', body: JSON.stringify({ text: 'Yaxshi' }) });
  });
});
