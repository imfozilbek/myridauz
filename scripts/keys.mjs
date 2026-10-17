// The keys and the settings of one environment by one command (docs/189):
// pnpm run keys --brand=<brand> --env=<internal|production> [--admins=<id>,<id>] [--dns] [--webhook]
// [--finish [--yes]]. CLOUDFLARE_API_TOKEN: the owner's key from the template "Create Additional Tokens"
// of the account of the environment; CLOUDFLARE_ACCOUNT_ID: that account. No key value is ever printed.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { setTimeout as wait } from 'node:timers/promises';
import { clientOf } from './deploy/cloudflare.mjs';
import { hostsOf } from './deploy/hosts.mjs';
import { mapBucket } from './deploy/r2-rules.mjs';
import { targetOf } from './deploy/target.mjs';
import { resourcesOf } from './deploy/worker-config.mjs';
import { runKeys } from './keys/run.mjs';
import { adminIds } from './keys/worker.mjs';

// A secret set a moment ago may reach the Worker a little later: setup-bots tries once more.
const SETTLE_MS = 20_000;
// The setup keys never go to setup-bots: it needs only the webhook secret.
const SETUP_KEYS = ['CLOUDFLARE_API_TOKEN', 'PROD_CLOUDFLARE_API_TOKEN'];

const { brand, environment } = targetOf('keys');
const flag = (name) => process.argv.includes(`--${name}`);
const admins = adminIds(process.argv.find((arg) => arg.startsWith('--admins='))?.split('=')[1]);
const { CLOUDFLARE_API_TOKEN: setupKey, CLOUDFLARE_ACCOUNT_ID: accountId } = process.env;
if (!setupKey || !accountId)
  throw new Error('keys: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID of the environment are needed');

const setupBots = async (secret) => {
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !SETUP_KEYS.includes(name)));
  const args = ['scripts/setup-bots.mjs', `--brand=${brand.id}`, `--env=${environment}`];
  const run = () =>
    execFileSync('node', args, { stdio: 'inherit', env: { ...env, TELEGRAM_WEBHOOK_SECRET: secret } });
  try {
    run();
  } catch {
    await wait(SETTLE_MS);
    run();
  }
};

await runKeys(clientOf(setupKey, accountId), {
  clientOf,
  brand,
  environment,
  accountId,
  flags: { dns: flag('dns'), webhook: flag('webhook'), finish: flag('finish'), yes: flag('yes') },
  hosts: hostsOf(brand),
  bucket: mapBucket(brand),
  worker: resourcesOf(readFileSync(`brands/${brand.id}/wrangler.toml`, 'utf8')).worker,
  admins,
  setupBots,
  again: `bots are silent: Claude runs pnpm run keys --brand=${brand.id} --env=${environment} --webhook`,
  say: (line) => console.log(line),
});
