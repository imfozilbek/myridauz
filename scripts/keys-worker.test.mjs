import { describe, expect, it } from 'vitest';
import { adminIds, workerSteps } from './keys/worker.mjs';

const BOTS = ['PASSENGER', 'DRIVER', 'ADMIN', 'SUPPORT', 'MAIN', 'POSTER'].map((bot) => `${bot}_BOT_TOKEN`);
const CALLS = ['REALTIME_APP_ID', 'REALTIME_APP_SECRET', 'TURN_KEY_ID', 'TURN_KEY_TOKEN'];
// A Worker with these secrets; null: the first deploy has not made it yet.
const worker = (names, { turnFails = false } = {}) => {
  const put = new Map();
  const posted = [];
  const request = async (method, path, body) => {
    if (method === 'GET') return names && names.map((name) => ({ name }));
    if (method === 'DELETE') return posted.push(`DELETE ${path}`);
    if (turnFails && path.endsWith('/turn_keys')) throw new Error('cloudflare POST turn_keys: [{"code":1}]');
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

  it('takes only Telegram ids with commas for the team', () => {
    expect(adminIds('111,222')).toBe('111,222');
    expect(adminIds(undefined)).toBeUndefined();
    expect(() => adminIds('111;abc')).toThrow('--admins takes Telegram ids');
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
  it('takes away a new call app when its TURN key fails, and goes on', async () => {
    const { put, posted, request } = worker(
      ALL.filter((name) => !CALLS.includes(name)),
      { turnFails: true },
    );
    const report = await steps(request);
    expect(posted).toEqual(['/accounts/:account/calls/apps', 'DELETE /accounts/:account/calls/apps/app-id']);
    expect(put.size).toBe(0);
    expect(report.at(-1)).toMatch(/^owner: Realtime/u);
  });

  it('says how to point the bots again when setup-bots fails after the new secret', async () => {
    const { put, request } = worker(ALL);
    const failing = async () => {
      throw new Error('setup-bots /telegram/setup: 401');
    };
    const report = await steps(request, { webhook: true, setupBots: failing, again: 'run --webhook' });
    expect(put.has('TELEGRAM_WEBHOOK_SECRET')).toBe(true);
    expect(report.slice(-2)).toEqual([
      'failed: Error: setup-bots /telegram/setup: 401',
      'owner: run --webhook',
    ]);
  });
});
