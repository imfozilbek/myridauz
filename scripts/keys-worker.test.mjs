import { describe, expect, it } from 'vitest';
import { workerSteps } from './keys/worker.mjs';

const BOTS = ['PASSENGER', 'DRIVER', 'ADMIN', 'SUPPORT', 'MAIN', 'POSTER'].map((bot) => `${bot}_BOT_TOKEN`);
const CALLS = ['REALTIME_APP_ID', 'REALTIME_APP_SECRET', 'TURN_KEY_ID', 'TURN_KEY_TOKEN'];
// A Worker with these secrets; null: the first deploy has not made it yet.
const worker = (names) => {
  const put = new Map();
  const posted = [];
  const request = async (method, path, body) => {
    if (method === 'GET') return names && names.map((name) => ({ name }));
    if (method === 'PUT') put.set(body.name, body.text);
    if (method === 'POST') posted.push(path);
    if (path.endsWith('/apps')) return { uid: 'app-id', secret: 'app-secret' };
    if (path.endsWith('/turn_keys')) return { uid: 'turn-id', key: 'turn-key' };
    return null;
  };
  return { put, posted, request };
};
const steps = (request, more = {}) =>
  workerSteps(request, {
    worker: 'acme-backend',
    accountId: 'a1',
    calls: 'acme-prod-calls',
    analyticsKey: async () => null,
    setupBots: async () => {},
    ...more,
  });
const ALL = ['CF_ACCOUNT_ID', 'ANALYTICS_API_TOKEN', 'TELEGRAM_WEBHOOK_SECRET', ...CALLS, ...BOTS];

// docs/189: Claude sets the secrets of the Worker; the keys of the bots stay the owner's (docs/32).
describe('the secrets of the Worker', () => {
  it('waits for the first deploy and touches nothing before it', async () => {
    const { put, request } = worker(null);
    expect(await steps(request)).toEqual(['worker acme-backend: none yet, run again after the first deploy']);
    expect(put.size).toBe(0);
  });

  it('keeps a Worker that has everything as it is', async () => {
    const { put, posted, request } = worker(ALL);
    expect(await steps(request)).toEqual([]);
    expect(put.size).toBe(0);
    expect(posted).toEqual([]);
  });

  it('sets the account, the team and a new dashboard key', async () => {
    const { put, request } = worker(ALL.filter((name) => name !== 'CF_ACCOUNT_ID'));
    await steps(request, { admins: '111,222', analyticsKey: async () => 'new-analytics' });
    expect(Object.fromEntries(put)).toEqual({
      CF_ACCOUNT_ID: 'a1',
      ADMIN_TELEGRAM_IDS: '111,222',
      ANALYTICS_API_TOKEN: 'new-analytics',
    });
  });

  it('stops on team ids that are not Telegram ids', async () => {
    const { request } = worker(ALL);
    await expect(steps(request, { admins: '111;abc' })).rejects.toThrow('--admins takes Telegram ids');
  });

  it('makes the call keys once when the Worker has none', async () => {
    const { put, posted, request } = worker(ALL.filter((name) => !CALLS.includes(name)));
    await steps(request);
    expect(posted).toEqual(['/accounts/:account/calls/apps', '/accounts/:account/calls/turn_keys']);
    expect(Object.fromEntries(put)).toEqual({
      REALTIME_APP_ID: 'app-id',
      REALTIME_APP_SECRET: 'app-secret',
      TURN_KEY_ID: 'turn-id',
      TURN_KEY_TOKEN: 'turn-key',
    });
  });

  it('names the call keys by hand when Cloudflare has no right for them', async () => {
    const { posted, request } = worker(ALL.filter((name) => !CALLS.includes(name)));
    const report = await steps(request, { calls: null });
    expect(report[0]).toMatch(/^owner: Realtime/u);
    expect(posted).toEqual([]);
  });

  it('asks the owner for the bot keys before the webhook secret', async () => {
    const without = ALL.filter((name) => name !== 'TELEGRAM_WEBHOOK_SECRET' && !name.startsWith('MAIN'));
    const { put, request } = worker(without);
    let pointed = false;
    const report = await steps(request, { setupBots: async () => (pointed = true) });
    expect(report).toEqual(['owner: put MAIN_BOT_TOKEN into acme-backend, then run again']);
    expect(put.size).toBe(0);
    expect(pointed).toBe(false);
  });

  it('points the bots with the new webhook secret it set and never reports the value', async () => {
    const { put, request } = worker(ALL);
    let pointed = null;
    const report = await steps(request, { webhook: true, setupBots: async (secret) => (pointed = secret) });
    const secret = put.get('TELEGRAM_WEBHOOK_SECRET');
    expect(secret).toMatch(/^[0-9a-f]{64}$/u);
    expect(pointed).toBe(secret);
    expect(report.join('\n')).not.toContain(secret);
  });
});
