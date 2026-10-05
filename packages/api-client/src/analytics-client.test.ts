import { MAX_ANALYTICS_BATCH, type AnalyticsBatch } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { createAnalyticsClient } from './analytics-client';

const context = {
  app: 'driver',
  sessionId: '6f1c2f7e-3c1b-4f5e-9a3d-2b8c1d0e4f5a',
  version: '0.1.0',
} as const;

function setup(respond: () => Promise<Response> = async () => new Response(null, { status: 204 })) {
  const sent: { url: string; batch: AnalyticsBatch }[] = [];
  const tasks: (() => void)[] = [];
  const client = createAnalyticsClient({
    baseUrl: 'https://api.test/',
    context,
    now: () => 1_790_000_000_000,
    schedule: (task) => {
      tasks.push(task);
      return () => tasks.splice(tasks.indexOf(task), 1);
    },
    fetch: async (url, init) => {
      sent.push({ url, batch: JSON.parse(String(init?.body)) });
      return respond();
    },
  });
  return { client, sent, tasks };
}

describe('createAnalyticsClient', () => {
  it('sends events in one batch after a delay, with context and time', async () => {
    const { client, sent, tasks } = setup();
    client.track({ name: 'screen_open', screen: 'welcome' });
    client.track({ name: 'screen_open', screen: 'home' });
    expect(sent).toEqual([]);
    expect(tasks).toHaveLength(1);
    tasks[0]?.();
    await client.flush();
    expect(sent).toHaveLength(1);
    expect(sent[0]?.url).toBe('https://api.test/analytics');
    expect(sent[0]?.batch.events).toEqual([
      { name: 'screen_open', screen: 'welcome', ...context, at: 1_790_000_000_000 },
      { name: 'screen_open', screen: 'home', ...context, at: 1_790_000_000_000 },
    ]);
  });

  it('sends at once when the batch is full', async () => {
    const { client, sent, tasks } = setup();
    for (let i = 0; i < MAX_ANALYTICS_BATCH; i += 1) client.track({ name: 'screen_open', screen: 'home' });
    await client.flush();
    expect(sent).toHaveLength(1);
    expect(sent[0]?.batch.events).toHaveLength(MAX_ANALYTICS_BATCH);
    expect(tasks).toHaveLength(0);
  });

  it('does nothing when there is nothing to send', async () => {
    const { client, sent } = setup();
    await client.flush();
    expect(sent).toEqual([]);
  });

  it('never throws when the network fails', async () => {
    const { client } = setup(() => Promise.reject(new Error('offline')));
    client.track({ name: 'client_error', screen: 'home', code: 'render' });
    await expect(client.flush()).resolves.toBeUndefined();
  });

  it('keeps a batch without network and sends it later (G43)', async () => {
    let online = false;
    const { client, sent, tasks } = setup(() =>
      online
        ? Promise.resolve(new Response(null, { status: 204 }))
        : Promise.reject(new TypeError('offline')),
    );
    client.track({ name: 'screen_open', screen: 'home' });
    await client.flush();
    expect(tasks).toHaveLength(1);
    online = true;
    tasks[0]?.();
    await client.flush();
    expect(sent.at(-1)?.batch.events.map((event) => event.screen)).toEqual(['home']);
  });

  it('sends an API error with the screen opened last (G12)', async () => {
    const { client, sent } = setup();
    client.apiError('trips.not_found');
    client.track({ name: 'screen_open', screen: 'my_trips' });
    client.apiError('api.http_500');
    await client.flush();
    const errors = sent[0]?.batch.events.filter((event) => event.name === 'api_error');
    expect(errors?.map((event) => [event.screen, 'code' in event ? event.code : ''])).toEqual([
      ['app', 'trips.not_found'],
      ['my_trips', 'api.http_500'],
    ]);
  });
});
