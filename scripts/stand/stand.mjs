// pnpm stand: the whole Rida on this computer (docs/75). The same Worker, a local database with all
// migrations, the map of Uzbekistan and its search index, the three Mini Apps; the four bots get test tokens
// made here, so nothing reaches Cloudflare or Telegram and no key is needed.
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadBrand } from '../../brands/index.ts';
import { baseIsCurrent, buildIsFresh, copyState, markBase, markBuilt } from './reuse.mjs';
import { serveApp } from './serve-app.mjs';
import { serveTelegram } from './telegram-stub.mjs';
import {
  STAND_API_PORT,
  STAND_APPS,
  STAND_BASE,
  STAND_DIR,
  STAND_INSPECTOR_PORT,
  STAND_MAP_READY,
  STAND_OWNER_ID,
  STAND_STATE,
  STAND_TELEGRAM_PORT,
  STAND_VARS,
} from './paths.ts';

const brand = loadBrand(process.env.VITE_BRAND);
const config = `brands/${brand.id}/wrangler.toml`;
const local = ['--local', '--persist-to', STAND_STATE, '--config', config];
const run = (command, args, env = {}) =>
  execFileSync(command, args, { stdio: 'inherit', env: { ...process.env, ...env } });
const token = () => `${randomBytes(4).readUInt32BE()}:${randomBytes(24).toString('base64url')}`;

mkdirSync(STAND_DIR, { recursive: true });
// Made again when a value is new (the support bot, G30; calls, G33): every bot needs its token.
const LAST_BOT = 'TURN_KEY_TOKEN=';
if (!existsSync(STAND_VARS) || !readFileSync(STAND_VARS, 'utf8').includes(LAST_BOT)) {
  const vars = {
    PASSENGER_BOT_TOKEN: token(),
    DRIVER_BOT_TOKEN: token(),
    ADMIN_BOT_TOKEN: token(),
    SUPPORT_BOT_TOKEN: token(),
    TELEGRAM_WEBHOOK_SECRET: randomBytes(16).toString('hex'),
    ADMIN_TELEGRAM_IDS: String(STAND_OWNER_ID),
    // Calls are switched on with values that reach nothing: a call rings, but never connects (G33).
    REALTIME_APP_ID: 'stand',
    REALTIME_APP_SECRET: 'stand',
    TURN_KEY_ID: 'stand',
    TURN_KEY_TOKEN: 'stand',
  };
  writeFileSync(
    STAND_VARS,
    Object.entries(vars)
      .map(([key, value]) => `${key}=${value}\n`)
      .join(''),
  );
}
const migrate = (persist) =>
  run('pnpm', [
    'exec',
    'wrangler',
    'd1',
    'migrations',
    'apply',
    'DB',
    '--local',
    '--persist-to',
    persist,
    '--config',
    config,
  ]);
// The clean base gets a new migration once; the copies made from it already have every one (G71).
const BASE_STAMP = `${STAND_DIR}/base-migrations`;
const MIGRATIONS = 'apps/backend/migrations';
if (existsSync(STAND_BASE) && !baseIsCurrent(BASE_STAMP, MIGRATIONS)) {
  migrate(STAND_BASE);
  markBase(BASE_STAMP, MIGRATIONS);
}
// A stand with no data yet starts from the base too.
const fresh = existsSync(STAND_BASE) && (process.argv.includes('--fresh') || !existsSync(STAND_STATE));
const prepare = process.argv.includes('--prepare');
// --fresh: the people, trips and bookings of earlier runs are gone, the map stays (pnpm stand:check).
if (fresh) {
  rmSync(STAND_STATE, { recursive: true, force: true });
  copyState(STAND_BASE, STAND_STATE);
} else if (!prepare || !existsSync(STAND_BASE)) migrate(STAND_STATE);
if (!existsSync(STAND_BASE)) {
  if (!existsSync(STAND_MAP_READY)) {
    run('node', ['scripts/map-data.mjs', `--brand=${brand.id}`, '--local']);
    writeFileSync(STAND_MAP_READY, new Date().toISOString());
  }
  cpSync(STAND_STATE, STAND_BASE, { recursive: true });
  markBase(BASE_STAMP, MIGRATIONS);
}
// The Mini Apps ask their own origin: the server of each app passes the API on to the backend.
// Stands side by side share one build made before them (STAND_BUILT=1, scripts/stand/check.mjs);
// the build is made again only when the code of the apps changed after the last one (G71).
const BUILD_STAMP = `${STAND_DIR}/built-at`;
if (process.env.STAND_BUILT !== '1' && !buildIsFresh(BUILD_STAMP)) {
  const startedAt = Date.now();
  for (const app of Object.keys(STAND_APPS))
    run('pnpm', ['--filter', `@platform/miniapp-${app}`, 'build'], { VITE_API_URL: '/' });
  markBuilt(BUILD_STAMP, startedAt);
}
// --prepare: the data and the build only, for the stands that start next.
if (prepare) process.exit(0);

const host = `localhost:${STAND_API_PORT}`;
const api = `http://${host}`;
// --local-upstream: the Worker sees its own address as the stand, not the domain of the brand, so
// the addresses it builds (sockets of the chat and of the live screens) never point to production.
// The bots talk to the stub of Telegram; --test-scheduled lets a scenario run the Cron at once.
// Channel posts are on: they reach only the stub, so the scenarios see them (docs/80 S60). Each
// Cron run of a scenario runs every job, the hourly and the daily ones too (G56).
serveTelegram(STAND_TELEGRAM_PORT);
const telegram = `TELEGRAM_API_URL:http://localhost:${STAND_TELEGRAM_PORT}`;
const dev = ['dev', ...local, '--port', String(STAND_API_PORT), '--local-upstream', host];
dev.push('--inspector-port', String(STAND_INSPECTOR_PORT));
dev.push('--var', telegram, '--var', 'CHANNEL_POSTS:on', '--var', 'CRON_TIERS:off', '--test-scheduled');
const worker = spawn('pnpm', ['exec', 'wrangler', ...dev, '--env-file', resolve(STAND_VARS)], {
  stdio: 'inherit',
});
worker.on('exit', (code) => process.exit(code ?? 1));
for (const [app, port] of Object.entries(STAND_APPS)) {
  serveApp({ root: resolve(`apps/miniapp-${app}/dist`), port, api });
  console.log(`stand: ${app} http://localhost:${port}/`);
}
