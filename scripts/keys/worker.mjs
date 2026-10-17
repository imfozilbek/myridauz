import { randomBytes } from 'node:crypto';
import { softly } from './softly.mjs';

// The secrets of the Worker of an environment that the setup sets (docs/189). The keys of the bots are
// never here: the owner puts them in himself (docs/32).
const BOTS = ['PASSENGER', 'DRIVER', 'ADMIN', 'SUPPORT', 'MAIN', 'POSTER'].map((bot) => `${bot}_BOT_TOKEN`);
const CALLS = ['REALTIME_APP_ID', 'REALTIME_APP_SECRET', 'TURN_KEY_ID', 'TURN_KEY_TOKEN'];
const IDS = /^\d+(,\d+)*$/u;
const WEBHOOK_BYTES = 32;
const APPS = '/accounts/:account/calls/apps';
const TURN_KEYS = '/accounts/:account/calls/turn_keys';
const scriptOf = (worker) => `/accounts/:account/workers/scripts/${worker}/secrets`;

// The Telegram ids of the team (--admins); checked before the setup changes anything.
export function adminIds(value) {
  if (value !== undefined && !IDS.test(value))
    throw new Error('keys: --admins takes Telegram ids with commas');
  return value;
}

// The names of the secrets of the Worker, or null before the first deploy made it.
async function secretNames(request, worker) {
  const secrets = await request('GET', scriptOf(worker));
  return secrets && secrets.map((secret) => secret.name);
}

// Voice calls (docs/08): an app and a TURN key of the account; their secrets come back only once. A TURN
// key that fails takes its new app away, the next run makes both again.
async function callsSecrets(request, name) {
  const app = await request('POST', APPS, { name });
  const turn = await request('POST', TURN_KEYS, { name }).catch(async (error) => {
    await request('DELETE', `${APPS}/${app.uid}`);
    throw error;
  });
  return [
    ['REALTIME_APP_ID', app.uid],
    ['REALTIME_APP_SECRET', app.secret],
    ['TURN_KEY_ID', turn.uid],
    ['TURN_KEY_TOKEN', turn.key],
  ];
}

// Every step of the Worker. analyticsKey(has) gives a new value of the dashboard key or null when the
// Worker keeps its own; setupBots(secret) points the bots at the Worker with a new webhook secret.
export async function workerSteps(request, options) {
  const { worker, accountId, admins, calls, webhook, analyticsKey, setupBots, again, report = [] } = options;
  const names = await secretNames(request, worker);
  if (!names) {
    report.push(`worker ${worker}: none yet, run again after the first deploy`);
    return report;
  }
  const put = async (name, text) => {
    await request('PUT', scriptOf(worker), { name, text, type: 'secret_text' });
    report.push(`worker ${worker}: ${name} set`);
  };
  if (!names.includes('CF_ACCOUNT_ID')) await put('CF_ACCOUNT_ID', accountId);
  if (admins !== undefined) await put('ADMIN_TELEGRAM_IDS', admins);
  const analytics = await analyticsKey(names.includes('ANALYTICS_API_TOKEN'));
  if (analytics) await put('ANALYTICS_API_TOKEN', analytics);
  const callsByHand = 'Realtime: make an app and a TURN key, Claude sets their 4 secrets (docs/08)';
  const noCalls = CALLS.some((name) => !names.includes(name));
  if (noCalls && !calls) report.push(`owner: ${callsByHand}`);
  else if (noCalls)
    await softly(
      report,
      async () => {
        for (const [name, text] of await callsSecrets(request, calls)) await put(name, text);
      },
      callsByHand,
    );
  if (webhook || !names.includes('TELEGRAM_WEBHOOK_SECRET')) {
    const missing = BOTS.filter((name) => !names.includes(name));
    if (missing.length > 0) report.push(`owner: put ${missing.join(', ')} into ${worker}, then run again`);
    else {
      const secret = randomBytes(WEBHOOK_BYTES).toString('hex');
      await put('TELEGRAM_WEBHOOK_SECRET', secret);
      // Telegram still sends the old secret until setup-bots runs: the bots are silent till then.
      const pointed = await softly(report, async () => (await setupBots(secret), true), again);
      if (pointed) report.push('bots: webhooks and looks set');
    }
  }
  return report;
}
