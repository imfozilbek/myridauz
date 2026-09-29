import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import type { AppEnv } from '../../env';
import type { Realtime } from './application/ports';
import { callRoutes } from './http/call-routes';
import { realtimeApi } from './infrastructure/realtime-api';

const KEY = 'b00000000-0000-0000-0000-000000000001';

function recorder(answers: unknown[]) {
  const asked: { url: string; method: string; body: unknown; auth: string }[] = [];
  const api = realtimeApi({
    appId: 'app1',
    appSecret: 'app-secret',
    turnKeyId: 'turn1',
    turnKeyToken: 'turn-secret',
    fetch: async (url, init) => {
      const headers = init?.headers as Record<string, string>;
      asked.push({
        url,
        method: init?.method ?? '',
        body: init?.body === undefined ? undefined : JSON.parse(String(init.body)),
        auth: headers.authorization ?? '',
      });
      return Response.json(answers.shift() ?? {});
    },
  });
  return { api, asked };
}

describe('Cloudflare Realtime (docs/08, G13)', () => {
  it('publishes the local voice in a new session and answers the offer', async () => {
    const { api, asked } = recorder([
      { sessionId: 's1' },
      { sessionDescription: { type: 'answer', sdp: 'A' } },
    ]);
    expect(await api.connect('O', '0', 'voice-10')).toEqual({ sessionId: 's1', answer: 'A' });
    expect(asked.map((item) => `${item.method} ${item.url}`)).toEqual([
      'POST https://rtc.live.cloudflare.com/v1/apps/app1/sessions/new',
      'POST https://rtc.live.cloudflare.com/v1/apps/app1/sessions/s1/tracks/new',
    ]);
    expect(asked[1]?.body).toEqual({
      sessionDescription: { type: 'offer', sdp: 'O' },
      tracks: [{ location: 'local', mid: '0', trackName: 'voice-10' }],
    });
    expect(asked[0]?.auth).toBe('Bearer app-secret');
    // Realtime refuses a new session with any body, even an empty one.
    expect(asked[0]?.body).toBeUndefined();
  });

  it('says the other voice is not ready while Realtime cannot find its track', async () => {
    const { api } = recorder([{ tracks: [{ errorCode: 'not_found_track_error' }] }]);
    await expect(api.pull('s1', { sessionId: 's2', trackName: 'voice-1' })).rejects.toThrow(
      'calls.track_not_ready',
    );
  });

  it('pulls the other voice, renegotiates and gives short TURN credentials', async () => {
    const { api, asked } = recorder([
      { requiresImmediateRenegotiation: true, sessionDescription: { type: 'offer', sdp: 'N' } },
      {},
      { iceServers: [{ urls: ['turn:turn.cloudflare.com:3478'], username: 'u', credential: 'c' }] },
    ]);
    expect(await api.pull('s1', { sessionId: 's2', trackName: 'voice-1' })).toBe('N');
    await api.renegotiate('s1', 'A2');
    expect(asked[1]).toMatchObject({
      method: 'PUT',
      body: { sessionDescription: { type: 'answer', sdp: 'A2' } },
    });
    expect((await api.iceServers()).iceServers[0]?.username).toBe('u');
    expect(asked[2]).toMatchObject({ body: { ttl: 3600 }, auth: 'Bearer turn-secret' });
  });
});

describe('call routes (docs/08)', () => {
  const realtime: Realtime = {
    iceServers: async () => ({ iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }] }),
    connect: async () => ({ sessionId: 's1', answer: 'A' }),
    pull: async () => null,
    renegotiate: async () => undefined,
  };
  const serve = (allowed: boolean, available: Realtime | null) =>
    new Hono<AppEnv>()
      .use(async (context, next) => {
        context.set('session', { user: { id: 10 } } as AppEnv['Variables']['session']);
        await next();
      })
      .route(
        '/',
        callRoutes(
          async () => allowed,
          () => available,
        ),
      );
  const post = (app: ReturnType<typeof serve>, path: string, body: unknown = {}) =>
    app.request(path, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    });

  it('lets only people of a confirmed booking call, and keeps working without Realtime set up', async () => {
    const offer = { offer: 'O', mid: '0', trackName: 'voice-10' };
    expect((await post(serve(false, realtime), `/calls/${KEY}/connect`, offer)).status).toBe(403);
    expect((await post(serve(true, null), `/calls/${KEY}/connect`, offer)).status).toBe(503);
    expect((await post(serve(true, realtime), `/calls/bad/connect`, offer)).status).toBe(400);
    expect(await (await post(serve(true, realtime), `/calls/${KEY}/connect`, offer)).json()).toEqual({
      sessionId: 's1',
      answer: 'A',
    });
    expect((await post(serve(true, realtime), `/calls/${KEY}/ice`)).status).toBe(200);
    const pull = { sessionId: 's1', remote: { sessionId: 's2', trackName: 'voice-1' } };
    expect(await (await post(serve(true, realtime), `/calls/${KEY}/pull`, pull)).json()).toEqual({
      offer: null,
    });
  });

  it('answers 503 when Realtime refuses', async () => {
    const broken = { ...realtime, iceServers: () => Promise.reject(new Error('calls.realtime_500')) };
    expect((await post(serve(true, broken), `/calls/${KEY}/ice`)).status).toBe(503);
  });
});
