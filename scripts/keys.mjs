// The keys and the settings of one environment by one command (docs/189):
// pnpm run keys --brand=<brand> --env=<internal|production> [--admins=<id>,<id>] [--dns] [--webhook]
// [--finish [--yes]]. CLOUDFLARE_API_TOKEN: the owner's key from the template "Create Additional Tokens"
// of the account of the environment; CLOUDFLARE_ACCOUNT_ID: that account. No key value is ever printed.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { setTimeout as wait } from 'node:timers/promises';
import { ensureAccountOf } from './deploy/account.mjs';
import { clientOf } from './deploy/cloudflare.mjs';
import { hostsOf } from './deploy/hosts.mjs';
import { targetOf } from './deploy/target.mjs';
import { resourcesOf } from './deploy/worker-config.mjs';
import { ANALYTICS, DEPLOY, SETUP, groupsOf, optionalOf, policiesOf } from './keys/rights.mjs';
import {
  dropToken,
  ensureToken,
  hourToken,
  oldTokens,
  ownId,
  permissionGroups,
  rolled,
  tokensOf,
} from './keys/tokens.mjs';
import { workerSteps } from './keys/worker.mjs';
import { zoneSteps } from './keys/zone.mjs';

// Key names by brand, environment and task (docs/179): <brand>-internal-deploy, <brand>-prod-analytics.
const SHORT = { internal: 'internal', production: 'prod' };
const KEPT = ['deploy', 'analytics'];
// A secret set a moment ago may reach the Worker a little later: setup-bots tries once more.
const SETTLE_MS = 20_000;

const { brand, environment } = targetOf('keys');
const flag = (name) => process.argv.includes(`--${name}`);
const admins = process.argv.find((arg) => arg.startsWith('--admins='))?.split('=')[1];
const { CLOUDFLARE_API_TOKEN: setupKey, CLOUDFLARE_ACCOUNT_ID: accountId } = process.env;
const nameOf = (env, task) => `${brand.id}-${SHORT[env]}-${task}`;
const say = (...lines) => lines.forEach((line) => console.log(line));

if (!setupKey || !accountId)
  throw new Error('keys: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID of the environment are needed');
const setup = clientOf(setupKey, accountId);
const groups = await permissionGroups(setup).catch(() => {
  throw new Error(
    'keys: CLOUDFLARE_API_TOKEN is not a key of the template "Create Additional Tokens" (docs/189)',
  );
});
const optional = optionalOf(groups);
const hourRights = [...groupsOf(SETUP, groups), ...Object.values(optional).filter(Boolean)];
const hour = await hourToken(setup, nameOf(environment, 'hour'), policiesOf(hourRights, { accountId }));
const work = clientOf(hour.value, accountId);

const setupBots = async (secret) => {
  const args = ['scripts/setup-bots.mjs', `--brand=${brand.id}`, `--env=${environment}`];
  const run = () =>
    execFileSync('node', args, {
      stdio: 'inherit',
      env: { ...process.env, TELEGRAM_WEBHOOK_SECRET: secret },
    });
  try {
    run();
  } catch {
    await wait(SETTLE_MS);
    run();
  }
};

try {
  const zone = await ensureAccountOf(brand, environment, work);
  const tokens = await tokensOf(setup);
  const ensure = (task, set, zoneId) =>
    ensureToken(
      setup,
      tokens,
      nameOf(environment, task),
      policiesOf(groupsOf(set, groups), { accountId, zoneId }),
    );
  const deploy = await ensure('deploy', DEPLOY, zone.id);
  say(`key ${nameOf(environment, 'deploy')}: ${deploy.state}`);
  if (deploy.state === 'made')
    say(
      `owner: API Tokens → ${nameOf(environment, 'deploy')} → Roll → GitHub ${environment}: CLOUDFLARE_API_TOKEN`,
    );
  say(...(await zoneSteps(work, { zone, hosts: hostsOf(brand), optional, dropOld: flag('dns') })));
  const { worker } = resourcesOf(readFileSync(`brands/${brand.id}/wrangler.toml`, 'utf8'));
  // The dashboard key: a new value when it is made, when the Worker has none, and before --finish
  // deletes the old keys (the Worker may still hold one of them).
  const analyticsKey = async (has) => {
    const key = await ensure('analytics', ANALYTICS);
    say(`key ${nameOf(environment, 'analytics')}: ${key.state}`);
    if (key.value) return key.value;
    return has && !flag('finish') ? null : rolled(setup, key.id);
  };
  const calls = optional.calls ? nameOf(environment, 'calls') : null;
  const options = { worker, accountId, admins, calls, webhook: flag('webhook'), analyticsKey, setupBots };
  say(...(await workerSteps(work, options)));
} finally {
  await dropToken(setup, hour.id);
}

// The end of the setup (docs/189): every other key of the brand, then the setup key itself.
if (flag('finish')) {
  const kept = Object.keys(SHORT).flatMap((env) => KEPT.map((task) => nameOf(env, task)));
  for (const token of oldTokens(await tokensOf(setup), brand.id, kept)) {
    if (flag('yes')) await dropToken(setup, token.id);
    say(`key ${token.name}: ${flag('yes') ? 'deleted' : 'old, --yes deletes it'}`);
  }
  if (flag('yes')) {
    await dropToken(setup, await ownId(setup));
    say('setup key: deleted');
  }
}
say(`keys: ${brand.id} ${environment} done`);
