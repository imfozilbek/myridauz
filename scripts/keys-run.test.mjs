import { describe, expect, it } from 'vitest';
import { loadBrand } from '../brands/index.ts';
import { ANALYTICS, OPTIONAL, SETUP } from './keys/rights.mjs';
import { runKeys } from './keys/run.mjs';

const brand = loadBrand(loadBrand().id, 'internal');
const ACCOUNT = 'com.cloudflare.api.account';
const ZONE = `${ACCOUNT}.zone`;
// Every right of the run but the calls right: the fake Worker already holds the secrets of calls.
const ZONE_RIGHT = /^(Workers Routes|DNS|Zone|Bot Management) /u;
const GROUPS = [...SETUP, ...ANALYTICS, OPTIONAL.botFight, OPTIONAL.webAnalytics].map(([name]) => ({
  id: name,
  name,
  scopes: [ZONE_RIGHT.test(name) ? ZONE : ACCOUNT],
}));
const SECRETS = ['CF_ACCOUNT_ID', 'ANALYTICS_API_TOKEN', 'TELEGRAM_WEBHOOK_SECRET'];
const CALLS = ['REALTIME_APP_ID', 'REALTIME_APP_SECRET', 'TURN_KEY_ID', 'TURN_KEY_TOKEN'];
const old = (name) => ({
  id: name,
  name,
  policies: [{ resources: { [`${ACCOUNT}.a1`]: '*' }, permission_groups: [] }],
});

// One Cloudflare account for the whole run: it writes down every change in order.
function account({ tokens = [], secrets = [...SECRETS, ...CALLS], failPut = false, failHour = 0 } = {}) {
  const log = [];
  const keys = [...tokens];
  let hourFails = failHour;
  const request = async (method, path, body) => {
    if (path === '/user/tokens/permission_groups') return GROUPS;
    if (path === '/user/tokens/verify') return { id: 'setup' };
    if (path.startsWith('/user/tokens?')) return keys;
    if (method === 'POST' && path === '/user/tokens') {
      if (body.expires_on && hourFails-- > 0)
        throw new Error('cloudflare POST /user/tokens: [{"code":1001}]');
      keys.push({ id: body.name, ...body });
      log.push(`make ${body.name}`);
      return { id: body.name, value: `${body.name}-value` };
    }
    if (method === 'PUT' && path.endsWith('/value'))
      return log.push(`roll ${path.split('/')[3]}`) && 'rolled';
    if (method === 'DELETE' && path.startsWith('/user/tokens/'))
      return log.push(`drop ${path.split('/')[3]}`);
    if (path.startsWith('/zones?name=')) return [{ id: 'z1', name: brand.domain }];
    if (path.endsWith('/bot_management')) return { fight_mode: false };
    if (path.includes('/rum/')) return [{ ruleset: { zone_tag: 'z1' } }];
    if (path.includes('/secrets') && method === 'GET') return secrets.map((name) => ({ name }));
    if (path.includes('/secrets') && method === 'PUT') {
      if (failPut) throw new Error('cloudflare PUT secrets: [{"code":10000}]');
      return log.push(`secret ${body.name}=${body.text}`);
    }
    if (path.includes('/settings/'))
      return { value: { ssl: 'strict', always_use_https: 'on' }[path.split('/').at(-1)] ?? '1.2' };
    return [];
  };
  return { log, request };
}
const run = (cloud, flags = {}, lines = []) =>
  runKeys(cloud.request, {
    clientOf: () => cloud.request,
    brand,
    environment: 'internal',
    accountId: 'a1',
    flags: { dns: false, webhook: false, finish: false, yes: false, ...flags },
    hosts: [brand.domain],
    bucket: 'map',
    worker: 'backend',
    setupBots: async () => {},
    again: 'again',
    say: (line) => lines.push(line),
  });
const prefix = `${brand.id}-internal`;

// docs/189: the order of one run keeps every environment working at every moment.
describe('one run of the keys', () => {
  it('makes the keys, puts the dashboard key and drops its hour key last', async () => {
    const cloud = account({ secrets: [...CALLS, 'CF_ACCOUNT_ID', 'TELEGRAM_WEBHOOK_SECRET'] });
    const lines = [];
    await run(cloud, {}, lines);
    expect(cloud.log).toEqual([
      `make ${prefix}-hour`,
      `make ${prefix}-deploy`,
      `make ${prefix}-analytics`,
      `secret ANALYTICS_API_TOKEN=${prefix}-analytics-value`,
      `drop ${prefix}-hour`,
    ]);
    expect(lines).toContain(
      `owner: API Tokens → ${prefix}-deploy → Roll → GitHub internal: CLOUDFLARE_API_TOKEN`,
    );
    expect(lines.join('\n')).not.toContain(`${prefix}-deploy-value`);
  });

  it('drops the hour key and deletes nothing when a step fails', async () => {
    const cloud = account({ tokens: [old(`${brand.id}-claude`)], secrets: [...CALLS], failPut: true });
    await expect(run(cloud, { finish: true, yes: true })).rejects.toThrow('PUT secrets');
    expect(cloud.log.at(-1)).toBe(`drop ${prefix}-hour`);
    expect(cloud.log).not.toContain(`drop ${brand.id}-claude`);
  });

  it('only lists the old keys without --yes and rolls nothing', async () => {
    const kept = [old(`${prefix}-deploy`), old(`${prefix}-analytics`)];
    const cloud = account({ tokens: [...kept, old(`${brand.id}-claude`)] });
    const lines = [];
    await run(cloud, { finish: true }, lines);
    expect(lines).toContain(`key ${brand.id}-claude: old, --yes deletes it`);
    expect(cloud.log).toEqual([`make ${prefix}-hour`, `drop ${prefix}-hour`]);
  });

  it('puts a new dashboard key before it deletes the old keys and its own key last', async () => {
    const kept = [old(`${prefix}-deploy`), old(`${prefix}-analytics`)];
    const cloud = account({ tokens: [...kept, old(`${brand.id}-claude`)] });
    await run(cloud, { finish: true, yes: true });
    expect(cloud.log.slice(1)).toEqual([
      `roll ${prefix}-analytics`,
      'secret ANALYTICS_API_TOKEN=rolled',
      `drop ${prefix}-hour`,
      `drop ${brand.id}-claude`,
      'drop setup',
    ]);
  });

  it('deletes nothing at the end while GitHub still holds an old deploy key', async () => {
    const cloud = account({ tokens: [old(`${brand.id}-claude`)] });
    const lines = [];
    await run(cloud, { finish: true, yes: true }, lines);
    expect(cloud.log).not.toContain(`drop ${brand.id}-claude`);
    expect(lines).toContain(
      'owner: Roll the new deploy key into GitHub first, then Claude runs --finish --yes again',
    );
  });

  it('makes the hour key without the optional rights when the user may not give them', async () => {
    const cloud = account({ failHour: 1 });
    const lines = [];
    await run(cloud, {}, lines);
    expect(lines[0]).toMatch(/^hour key without the optional rights/u);
    expect(lines).toContain(`owner: ${brand.domain} → Security → Bots → Bot Fight Mode: Off`);
  });

  it('names a key that is not a setup key with the answer of Cloudflare', async () => {
    const refused = async () => {
      throw new Error('cloudflare GET /user/tokens/permission_groups: [{"code":9109}]');
    };
    const cloud = { request: refused };
    await expect(run(cloud)).rejects.toThrow(/not a key of the template .*9109/u);
  });
});
