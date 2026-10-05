import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { appHost, mapHost } from '../../brands/index.ts';
import { cloudflare } from './cloudflare.mjs';
import { mapBucket, mapCors, oldArchives, withStoriesRule } from './r2-rules.mjs';

// The R2 steps of a deploy and of the map data (G57, docs/67, docs/117).
const BUCKETS = '/accounts/:account/r2/buckets';
// A file name never changes its bytes: phones and the edge keep a part for a week.
const KEEP = 'public, max-age=604800, immutable';
const WORK = '.map-move';
const typeOf = (key) => (key.endsWith('.pmtiles') ? 'application/vnd.pmtiles' : 'application/x-protobuf');
const wrangler = (...args) => execFileSync('pnpm', ['exec', 'wrangler', ...args], { stdio: 'inherit' });

export const putMapObject = (bucket, key, file) =>
  wrangler(
    'r2',
    'object',
    'put',
    `${bucket}/${key}`,
    '--file',
    file,
    '--content-type',
    typeOf(key),
    '--cache-control',
    KEEP,
    '--remote',
  );
const deleteObject = (bucket, key) => wrangler('r2', 'object', 'delete', `${bucket}/${key}`, '--remote');

const keysOf = async (bucket, prefix) =>
  (
    (await cloudflare(
      'GET',
      `${BUCKETS}/${bucket}/objects?prefix=${encodeURIComponent(prefix)}&per_page=1000`,
    )) ?? []
  ).map((object) => object.key);

// The pictures of driver stories in MEDIA live a day.
export async function ensureStoriesRule(bucket) {
  const current = await cloudflare('GET', `${BUCKETS}/${bucket}/lifecycle`);
  await cloudflare('PUT', `${BUCKETS}/${bucket}/lifecycle`, { rules: withStoriesRule(current?.rules ?? []) });
}

// The public bucket of the map at map.<domain>, read only by the Mini Apps of the brand.
// apps: the Mini Apps of the repository (apps/miniapp-*), the same list the deploy builds.
export async function ensureMapBucket(brand, apps) {
  const name = mapBucket(brand);
  const host = mapHost(brand);
  const origins = apps.map((app) => `https://${appHost(brand, app)}`);
  if (!(await cloudflare('GET', `${BUCKETS}/${name}`))) await cloudflare('POST', BUCKETS, { name });
  await cloudflare('PUT', `${BUCKETS}/${name}/cors`, mapCors(origins));
  const custom = await cloudflare('GET', `${BUCKETS}/${name}/domains/custom`);
  if (!custom?.domains?.some((domain) => domain.domain === host)) {
    const [zone] = await cloudflare('GET', `/zones?name=${brand.domain}`);
    await cloudflare('POST', `${BUCKETS}/${name}/domains/custom`, {
      domain: host,
      zoneId: zone.id,
      enabled: true,
    });
  }
  return name;
}

// The archive answers by parts at its public address: the Mini Apps may read it there.
export async function mapServed(host, archive) {
  const response = await fetch(`https://${host}/map/${archive}`, { headers: { range: 'bytes=0-15' } }).catch(
    () => null,
  );
  return response?.status === 206;
}

// The map of G22 lived in MEDIA: the parts missing in the public bucket are copied there.
export async function copyMap(media, bucket) {
  const present = new Set(await keysOf(bucket, 'map/'));
  mkdirSync(WORK, { recursive: true });
  for (const [index, key] of (await keysOf(media, 'map/')).entries()) {
    if (present.has(key)) continue;
    const file = join(WORK, String(index));
    wrangler('r2', 'object', 'get', `${media}/${key}`, '--file', file, '--remote');
    putMapObject(bucket, key, file);
  }
}

// Once the public address answers, the copy in MEDIA goes, and older archives too.
export async function dropOldMaps(media, bucket, archive) {
  for (const key of await keysOf(media, 'map/')) deleteObject(media, key);
  for (const key of oldArchives(await keysOf(bucket, 'map/'), archive)) deleteObject(bucket, key);
}
