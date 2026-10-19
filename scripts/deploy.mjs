// One command deploys a brand to one environment (docs/22, docs/45, docs/179):
// pnpm run deploy --brand=<brand> --env=<internal|production>. Needs CLOUDFLARE_API_TOKEN and
// CLOUDFLARE_ACCOUNT_ID of the account of that environment. Bot tokens are Worker secrets, never used here (docs/32).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { apiHost, appHost, mapHost } from '../brands/index.ts';
import { MAP_ARCHIVE, MAP_FONTS } from '../packages/contracts/src/map.ts';
import { ensureAccountOf } from './deploy/account.mjs';
import { miniApps } from './deploy/hosts.mjs';
import { copyMap, dropOldMaps, ensureMapBucket, ensureStoriesRule, mapServed } from './deploy/map-bucket.mjs';
import { ensurePagesDomain, ensurePagesProject } from './deploy/pages.mjs';
import { targetOf } from './deploy/target.mjs';
import { workerConfig } from './deploy/worker-config.mjs';

const { brand, environment } = targetOf('deploy');
await ensureAccountOf(brand, environment);
const config = await workerConfig(brand, environment);
const apps = miniApps();
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
const answers = async (key) => mapBucket !== null && (await mapServed(mapHost(brand), key));
// The address answers once the fonts of the map are there. An archive of a new date comes with «Map
// data» before or after the deploy (G48): the older ones and the copy in MEDIA go once it answers.
const served = await answers(`fonts/${encodeURIComponent(MAP_FONTS[0])}/0-255.pbf`);
if (served && (await answers(MAP_ARCHIVE)))
  await step('old maps', () => dropOldMaps(media, mapBucket, MAP_ARCHIVE));
else if (!served) console.warn(`deploy: ${mapHost(brand)} does not answer yet, the map stays on the API`);

run('pnpm', ['--filter', './apps/miniapp-*', '--filter', './apps/landing', 'build'], {
  VITE_BRAND: brand.id,
  VITE_ENVIRONMENT: environment,
  VITE_API_URL: `https://${apiHost(brand)}`,
  ...(served ? { VITE_MAP_URL: `https://${mapHost(brand)}` } : {}),
  VITE_APP_VERSION: process.env.GITHUB_SHA?.slice(0, 7) ?? 'local',
});
// The landing lives on the brand domain itself, www leads to the same pages (G15, docs/59). It goes
// before the Worker: the bots send its pictures under a new version only once it serves them (lesson №314).
const landing = `${brand.id}-landing`;
const landingTarget = await ensurePagesProject(landing);
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
  await ensurePagesDomain(landing, host, brand.domain, landingTarget);
wrangler('d1', 'migrations', 'apply', 'DB', '--remote', '--config', config);
wrangler('deploy', '--config', config);

for (const app of apps) {
  const project = `${brand.id}-${app}`;
  const target = await ensurePagesProject(project);
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
  await ensurePagesDomain(project, appHost(brand, app), brand.domain, target);
}

console.log(`deploy: ${brand.id} ${environment} done`);
