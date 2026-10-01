// pnpm stand: the whole Rida on this computer (docs/75). The same Worker, a local database with all
// migrations, the map of Uzbekistan and its search index, the three Mini Apps; bots get test tokens
// made here, so nothing reaches Cloudflare or Telegram and no key is needed.
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadBrand } from '../../brands/index.ts';
import { serveApp } from './serve-app.mjs';
import { serveTelegram } from './telegram-stub.mjs';
import {
  STAND_API_PORT,
  STAND_APPS,
  STAND_BASE,
  STAND_DIR,
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
if (!existsSync(STAND_VARS)) {
  const vars = {
    PASSENGER_BOT_TOKEN: token(),
    DRIVER_BOT_TOKEN: token(),
    ADMIN_BOT_TOKEN: token(),
    TELEGRAM_WEBHOOK_SECRET: randomBytes(16).toString('hex'),
    ADMIN_TELEGRAM_IDS: String(STAND_OWNER_ID),
  };
  writeFileSync(
    STAND_VARS,
    Object.entries(vars)
      .map(([key, value]) => `${key}=${value}\n`)
      .join(''),
  );
}
// --fresh: the people, trips and bookings of earlier runs are gone, the map stays (pnpm stand:check).
if (process.argv.includes('--fresh') && existsSync(STAND_BASE)) {
  rmSync(STAND_STATE, { recursive: true, force: true });
  cpSync(STAND_BASE, STAND_STATE, { recursive: true });
}
run('pnpm', ['exec', 'wrangler', 'd1', 'migrations', 'apply', 'DB', ...local]);
if (!existsSync(STAND_MAP_READY)) {
  run('node', ['scripts/map-data.mjs', `--brand=${brand.id}`, '--local']);
  writeFileSync(STAND_MAP_READY, new Date().toISOString());
}
if (!existsSync(STAND_BASE)) cpSync(STAND_STATE, STAND_BASE, { recursive: true });
// The Mini Apps ask their own origin: the server of each app passes the API on to the backend.
for (const app of Object.keys(STAND_APPS))
  run('pnpm', ['--filter', `@platform/miniapp-${app}`, 'build'], { VITE_API_URL: '/' });

const host = `localhost:${STAND_API_PORT}`;
const api = `http://${host}`;
// --local-upstream: the Worker sees its own address as the stand, not the domain of the brand, so
// the addresses it builds (sockets of the chat and of the live screens) never point to production.
// The bots talk to the stub of Telegram; --test-scheduled lets a scenario run the Cron at once.
// Channel posts are on: they reach only the stub, so the scenarios see them (docs/80 S60).
serveTelegram(STAND_TELEGRAM_PORT);
const telegram = `TELEGRAM_API_URL:http://localhost:${STAND_TELEGRAM_PORT}`;
const dev = ['dev', ...local, '--port', String(STAND_API_PORT), '--local-upstream', host];
dev.push('--var', telegram, '--var', 'CHANNEL_POSTS:on', '--test-scheduled');
const worker = spawn('pnpm', ['exec', 'wrangler', ...dev, '--env-file', resolve(STAND_VARS)], {
  stdio: 'inherit',
});
worker.on('exit', (code) => process.exit(code ?? 1));
for (const [app, port] of Object.entries(STAND_APPS)) {
  serveApp({ root: resolve(`apps/miniapp-${app}/dist`), port, api });
  console.log(`stand: ${app} http://localhost:${port}/`);
}
