import { ensureAccountOf } from '../deploy/account.mjs';
import { ANALYTICS, DEPLOY, SETUP, groupsOf, optionalOf, policiesOf } from './rights.mjs';
import {
  dropToken,
  ensureToken,
  hourToken,
  oldTokens,
  ownId,
  permissionGroups,
  rolled,
  tokensOf,
} from './tokens.mjs';
import { workerSteps } from './worker.mjs';
import { zoneSteps } from './zone.mjs';

// Key names by brand, environment and task (docs/179): <brand>-internal-deploy, <brand>-prod-analytics.
const SHORT = { internal: 'internal', production: 'prod' };
const KEPT = ['deploy', 'analytics'];

// The hour key with the optional rights; when the user may not give one of them, the key goes without.
async function hourKey(setup, name, groups, accountId, say) {
  const optional = optionalOf(groups);
  const extra = Object.values(optional).filter(Boolean);
  const make = (list) => hourToken(setup, name, policiesOf(list, { accountId }));
  try {
    return { key: await make([...groupsOf(SETUP, groups), ...extra]), optional };
  } catch (error) {
    if (extra.length === 0) throw error;
    say(`hour key without the optional rights: ${String(error)}`);
    return { key: await make(groupsOf(SETUP, groups)), optional: {} };
  }
}

// The end of the setup (docs/189): every other key of the brand on this account, then the setup key.
async function finish(setup, { brand, nameOf, accountId, zoneId, yes, say }) {
  const kept = Object.keys(SHORT).flatMap((env) => KEPT.map((task) => nameOf(env, task)));
  const tokens = await tokensOf(setup, { expired: true });
  for (const token of oldTokens(tokens, brand.id, kept, { accountId, zoneId })) {
    if (yes) await dropToken(setup, token.id);
    say(`key ${token.name}: ${yes ? 'deleted' : 'old, --yes deletes it'}`);
  }
  if (!yes) return;
  await dropToken(setup, await ownId(setup));
  say('setup key: deleted');
}

// One run of `pnpm run keys` (docs/189). setup: the client of the owner's setup key; clientOf makes the
// client of the hour key; every line of the report goes to say at once.
export async function runKeys(setup, options) {
  const { clientOf, brand, environment, accountId, flags, say } = options;
  const nameOf = (env, task) => `${brand.id}-${SHORT[env]}-${task}`;
  const report = { push: (...lines) => lines.forEach((line) => say(line)) };
  const groups = await permissionGroups(setup).catch((error) => {
    const why = `not a key of the template "Create Additional Tokens" (docs/189): ${String(error)}`;
    throw new Error(`keys: CLOUDFLARE_API_TOKEN is ${why}`);
  });
  const hourName = nameOf(environment, 'hour');
  const { key: hour, optional } = await hourKey(setup, hourName, groups, accountId, say);
  const work = clientOf(hour.value, accountId);
  const ending = flags.finish && flags.yes;
  let zone;
  let deploy;
  try {
    // The work key and the account of this run stand for the secrets of a deploy job.
    const secrets = { CLOUDFLARE_API_TOKEN: hour.value, CLOUDFLARE_ACCOUNT_ID: accountId };
    zone = await ensureAccountOf(brand, environment, work, secrets);
    const tokens = await tokensOf(setup);
    const ensure = (task, set, zoneId) =>
      ensureToken(
        setup,
        tokens,
        nameOf(environment, task),
        policiesOf(groupsOf(set, groups), { accountId, zoneId }),
      );
    deploy = await ensure('deploy', DEPLOY, zone.id);
    say(`key ${nameOf(environment, 'deploy')}: ${deploy.state}`);
    if (deploy.state === 'made')
      say(
        `owner: API Tokens → ${nameOf(environment, 'deploy')} → Roll → GitHub ${environment}: CLOUDFLARE_API_TOKEN`,
      );
    const { hosts, bucket, worker, admins, setupBots, again } = options;
    await zoneSteps(work, { zone, hosts, bucket, optional, dropOld: flags.dns, report });
    // The dashboard key: a new value when it is made, when the Worker has none, and before the end
    // deletes the old keys (the Worker may still hold one of them).
    const analyticsKey = async (has) => {
      const key = await ensure('analytics', ANALYTICS);
      say(`key ${nameOf(environment, 'analytics')}: ${key.state}`);
      if (key.value) return key.value;
      return has && !ending ? null : rolled(setup, key.id);
    };
    const calls = optional.calls ? nameOf(environment, 'calls') : null;
    const steps = {
      worker,
      accountId,
      admins,
      calls,
      webhook: flags.webhook,
      analyticsKey,
      setupBots,
      again,
    };
    await workerSteps(work, { ...steps, report });
  } finally {
    await dropToken(setup, hour.id).catch((error) =>
      say(`warning: the hour key ends by itself: ${String(error)}`),
    );
  }
  // A deploy key made in this run is not in GitHub yet: GitHub still holds an old key.
  if (ending && deploy.state === 'made')
    say('owner: Roll the new deploy key into GitHub first, then Claude runs --finish --yes again');
  else if (flags.finish)
    await finish(setup, { brand, nameOf, accountId, zoneId: zone.id, yes: flags.yes, say });
  say(`keys: ${brand.id} ${environment} done`);
}
