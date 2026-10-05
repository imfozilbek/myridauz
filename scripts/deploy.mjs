// One command deploys a brand (docs/22, docs/45): pnpm run deploy --brand=<brand>
// Needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID. Bot tokens are Worker secrets, never used here (docs/32).
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { apiHost, appHost, loadBrand, mapHost } from '../brands/index.ts';
import { MAP_ARCHIVE } from '../packages/contracts/src/map.ts';
import { copyMap, dropOldMaps, ensureMapBucket, ensureStoriesRule, mapServed } from './deploy/map-bucket.mjs';
import { ensurePagesDomain, ensurePagesProject } from './deploy/pages.mjs';

const brandArg = process.argv.find((arg) => arg.startsWith('--brand='));
if (!brandArg) throw new Error('deploy: --brand=<brand> is required');
const brand = loadBrand(brandArg.split('=')[1]);
const config = `brands/${brand.id}/wrangler.toml`;
const apps = readdirSync('apps')
  .filter((dir) => dir.startsWith('miniapp-'))
  .map((dir) => dir.replace('miniapp-', ''));
const run = (command, args, env = {}) =>
  execFileSync(command, args, { stdio: 'inherit', env: { ...process.env, ...env } });
const wrangler = (...args) => run('pnpm', ['exec', 'wrangler', ...args]);

// R2 (G57, docs/117): story pictures live a day; the map goes from its own public bucket, not the
// Worker. Until the public address answers, the Mini Apps read the map through the API as before.
const media = /binding = "MEDIA"\s+bucket_name = "([^"]+)"/u.exec(readFileSync(config, 'utf8'))?.[1];
if (!media) throw new Error('deploy: no MEDIA bucket in wrangler.toml');
// A failed R2 step never stops the deploy: the warning is in the log, the map stays on the API.
const step = async (name, work, fallback) => {
  try {
    return await work();
  } catch (error) {
    console.warn(`deploy: ${name} failed, ${String(error)}`);
    return fallback;
  }
};
await step('stories rule', () => ensureStoriesRule(media));
const mapBucket = await step('map bucket', () => ensureMapBucket(brand, apps), null);
if (mapBucket) await step('map copy', () => copyMap(media, mapBucket));
const served = mapBucket !== null && (await mapServed(mapHost(brand), MAP_ARCHIVE));
// The copy in MEDIA goes only once the public address answers: the API keeps it until then.
if (served) await step('old maps', () => dropOldMaps(media, mapBucket, MAP_ARCHIVE));
else console.warn(`deploy: ${mapHost(brand)} does not answer yet, the map stays on the API`);

run('pnpm', ['--filter', './apps/miniapp-*', '--filter', './apps/landing', 'build'], {
  VITE_BRAND: brand.id,
  VITE_API_URL: `https://${apiHost(brand)}`,
  ...(served ? { VITE_MAP_URL: `https://${mapHost(brand)}` } : {}),
  VITE_APP_VERSION: process.env.GITHUB_SHA?.slice(0, 7) ?? 'local',
});
wrangler('d1', 'migrations', 'apply', 'DB', '--remote', '--config', config);
wrangler('deploy', '--config', config);

for (const app of apps) {
  const project = `${brand.id}-${app}`;
  await ensurePagesProject(project);
  wrangler(
    'pages',
    'deploy',
    `apps/miniapp-${app}/dist`,
    '--project-name',
    project,
    '--branch',
    'main',
    '--commit-dirty=true',
  );
  await ensurePagesDomain(project, appHost(brand, app), brand.domain);
}

// The landing lives on the brand domain itself, www leads to the same pages (G15, docs/59).
const landing = `${brand.id}-landing`;
await ensurePagesProject(landing);
wrangler(
  'pages',
  'deploy',
  'apps/landing/dist',
  '--project-name',
  landing,
  '--branch',
  'main',
  '--commit-dirty=true',
);
for (const host of [brand.domain, `www.${brand.domain}`])
  await ensurePagesDomain(landing, host, brand.domain);
console.log(`deploy: ${brand.id} done`);
