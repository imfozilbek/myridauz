import { describe, expect, it } from 'vitest';
import { isOld, zoneSettings, zoneSteps } from './keys/zone.mjs';

const ZONE = { id: 'z1', name: 'example.uz' };
const PARKING = { id: 'r1', type: 'A', name: 'example.uz', content: '203.0.113.7' };
// A new zone: the settings of a fresh account, R2 on, one parking record on the domain.
const cloudflare = ({ r2 = true, records = [PARKING] } = {}) => {
  const calls = [];
  const request = async (method, path, body) => {
    calls.push(`${method} ${path}`);
    if (path.endsWith('/settings/ssl')) return { value: 'full' };
    if (path.includes('/settings/')) return { value: path.endsWith('min_tls_version') ? '1.0' : 'on' };
    if (path.includes('/r2/') && !r2) throw new Error('cloudflare GET r2: [{"code":10042}]');
    if (path.includes('/dns_records?name=')) return records.filter((one) => path.endsWith(`=${one.name}`));
    return body ?? [];
  };
  return { calls, request };
};
const steps = (request, more = {}) =>
  zoneSteps(request, { zone: ZONE, hosts: [ZONE.name], optional: {}, dropOld: false, ...more });

// docs/189: the zone of every environment has the same settings, old records never break the deploy.
describe('the zone of an environment', () => {
  it('changes only the settings that differ', async () => {
    const { calls, request } = cloudflare();
    expect(await zoneSettings(request, 'z1')).toEqual(['ssl', 'min_tls_version']);
    expect(calls.filter((call) => call.startsWith('PATCH'))).toEqual([
      'PATCH /zones/z1/settings/ssl',
      'PATCH /zones/z1/settings/min_tls_version',
    ]);
  });

  it('calls old only a web record of another hosting', () => {
    expect(isOld(PARKING)).toBe(true);
    expect(isOld({ type: 'CNAME', content: 'acme-passenger.pages.dev' })).toBe(false);
    expect(isOld({ type: 'AAAA', content: '2001:db8::1', meta: { read_only: true } })).toBe(false);
    expect(isOld({ type: 'AAAA', content: '100::' })).toBe(false);
    expect(isOld({ type: 'TXT', content: 'v=spf1 -all' })).toBe(false);
  });

  it('lists the old records and deletes them only with --dns', async () => {
    const listed = cloudflare();
    expect(await steps(listed.request)).toContain('dns A example.uz → 203.0.113.7: old, --dns deletes it');
    expect(listed.calls.some((call) => call.startsWith('DELETE'))).toBe(false);
    const dropped = cloudflare();
    expect(await steps(dropped.request, { dropOld: true })).toContain(
      'dns A example.uz → 203.0.113.7: deleted',
    );
    expect(dropped.calls).toContain('DELETE /zones/z1/dns_records/r1');
  });

  it('gives the owner the steps its rights cannot do and R2 when it is off', async () => {
    const { calls, request } = cloudflare({ r2: false, records: [] });
    const report = await steps(request);
    expect(report).toEqual([
      'zone example.uz: ssl, min_tls_version set',
      'owner: example.uz → Security → Bots → Bot Fight Mode: Off',
      'owner: Web Analytics → Add a site → example.uz, automatic setup',
      'owner: R2 Object Storage → switch R2 on (a card may be asked, nothing is paid)',
    ]);
    expect(calls.some((call) => call.includes('bot_management') || call.includes('rum'))).toBe(false);
  });

  it('switches Bot Fight Mode off and adds Web Analytics once', async () => {
    const { calls, request } = cloudflare({ records: [] });
    const fight = async (method, path, body) =>
      path.endsWith('/bot_management') && method === 'GET'
        ? { fight_mode: true }
        : request(method, path, body);
    const report = await steps(fight, { optional: { botFight: {}, webAnalytics: {} } });
    expect(report).toContain('zone example.uz: Bot Fight Mode off');
    expect(report).toContain('web analytics: example.uz added');
    expect(calls).toContain('PUT /zones/z1/bot_management');
    expect(calls).toContain('POST /accounts/:account/rum/site_info');
  });

  it('goes on when an optional step fails and names it by hand', async () => {
    const { request } = cloudflare({ records: [] });
    const failing = async (method, path, body) => {
      if (path.includes('bot_management')) throw new Error('cloudflare GET bot_management: [{"code":9109}]');
      return request(method, path, body);
    };
    const report = await steps(failing, { optional: { botFight: {} } });
    expect(report).toContain('owner: example.uz → Security → Bots → Bot Fight Mode: Off');
    expect(report.some((line) => line.startsWith('failed: Error: cloudflare GET bot_management'))).toBe(true);
  });
});
