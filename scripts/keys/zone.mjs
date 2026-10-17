import { softly } from './softly.mjs';

// The zone of an environment (docs/189): the same settings in every environment, and the old web records
// of another hosting out of the way of the deploy.
const SETTINGS = { ssl: 'strict', always_use_https: 'on', min_tls_version: '1.2' };
const WEB = new Set(['A', 'AAAA', 'CNAME']);
// The empty addresses a Worker route stands on: the deploy needs them.
const PLACEHOLDERS = new Set(['100::', '192.0.2.1']);
// Cloudflare answers so when R2 was never switched on in the dashboard.
const R2_OFF = '10042';
// The other bot settings of the zone go back as they were: the update takes the whole set.
const BOT_FIELDS = ['enable_js', 'ai_bots_protection', 'crawler_protection', 'is_robots_txt_managed'];

export async function zoneSettings(request, zoneId) {
  const changed = [];
  const set = async (name, value) => {
    await request('PATCH', `/zones/${zoneId}/settings/${name}`, { value });
    changed.push(name);
  };
  // In the automatic mode Cloudflare picks the SSL mode itself and keeps no other one.
  const automatic = await request('GET', `/zones/${zoneId}/settings/ssl_automatic_mode`);
  if (automatic?.value === 'auto') await set('ssl_automatic_mode', 'custom');
  for (const [name, value] of Object.entries(SETTINGS)) {
    const now = await request('GET', `/zones/${zoneId}/settings/${name}`);
    if (now?.value !== value) await set(name, value);
  }
  return changed;
}

// Bot Fight Mode may stop the webhooks of Telegram (docs/85).
async function botFightOff(request, zoneId) {
  const now = await request('GET', `/zones/${zoneId}/bot_management`);
  if (!now?.fight_mode) return false;
  const kept = Object.fromEntries(BOT_FIELDS.filter((name) => name in now).map((name) => [name, now[name]]));
  await request('PUT', `/zones/${zoneId}/bot_management`, { ...kept, fight_mode: false });
  return true;
}

// Web Analytics of the landing with automatic setup on the zone (docs/59).
async function webAnalytics(request, zone) {
  const sites = (await request('GET', '/accounts/:account/rum/site_info/list?per_page=100')) ?? [];
  if (sites.some((site) => site.ruleset?.zone_tag === zone.id || site.host === zone.name)) return false;
  const site = { host: zone.name, zone_tag: zone.id, auto_install: true };
  await request('POST', '/accounts/:account/rum/site_info', site);
  return true;
}

// R2 is switched on once in the dashboard (the account accepts its terms); the API cannot do it.
export async function r2On(request) {
  try {
    await request('GET', '/accounts/:account/r2/buckets');
    return true;
  } catch (error) {
    if (String(error).includes(R2_OFF)) return false;
    throw error;
  }
}

// A web record the deploy does not own: a parking page or an old hosting. The deploy points Pages
// addresses to pages.dev; Workers and R2 keep their records read only.
export const isOld = (record) =>
  WEB.has(record.type) &&
  !record.meta?.read_only &&
  !PLACEHOLDERS.has(record.content) &&
  !(record.type === 'CNAME' && record.content.endsWith('.pages.dev'));

// The addresses a Worker or the map bucket already serves: their records are never old.
async function servedHosts(request, zone, bucket, r2) {
  const workers = (await request('GET', `/accounts/:account/workers/domains?zone_id=${zone.id}`)) ?? [];
  const map = r2 ? await request('GET', `/accounts/:account/r2/buckets/${bucket}/domains/custom`) : null;
  return new Set([...workers.map((one) => one.hostname), ...(map?.domains ?? []).map((one) => one.domain)]);
}

async function oldRecords(request, zone, hosts, served) {
  const found = [];
  for (const host of hosts.filter((one) => !served.has(one)))
    found.push(...((await request('GET', `/zones/${zone.id}/dns_records?name=${host}`)) ?? []));
  return found.filter(isOld);
}

// Every step of the zone; the old records go only with --dns, after the list was read.
export async function zoneSteps(request, { zone, hosts, bucket, optional, dropOld, report = [] }) {
  const changed = await zoneSettings(request, zone.id);
  report.push(`zone ${zone.name}: ${changed.length > 0 ? `${changed.join(', ')} set` : 'settings kept'}`);
  const botFightByHand = `${zone.name} → Security → Bots → Bot Fight Mode: Off`;
  if (!optional.botFight) report.push(`owner: ${botFightByHand}`);
  else if (await softly(report, () => botFightOff(request, zone.id), botFightByHand))
    report.push(`zone ${zone.name}: Bot Fight Mode off`);
  const analyticsByHand = `Web Analytics → Add a site → ${zone.name}, automatic setup`;
  if (!optional.webAnalytics) report.push(`owner: ${analyticsByHand}`);
  else if (await softly(report, () => webAnalytics(request, zone), analyticsByHand))
    report.push(`web analytics: ${zone.name} added`);
  const r2 = await r2On(request);
  if (!r2) report.push('owner: R2 Object Storage → switch R2 on (a card may be asked, nothing is paid)');
  for (const record of await oldRecords(request, zone, hosts, await servedHosts(request, zone, bucket, r2))) {
    if (dropOld) await request('DELETE', `/zones/${zone.id}/dns_records/${record.id}`);
    const state = dropOld ? 'deleted' : 'old, --dns deletes it';
    report.push(`dns ${record.type} ${record.name} → ${record.content}: ${state}`);
  }
  return report;
}
