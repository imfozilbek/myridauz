import { randomBytes } from 'node:crypto';
import { softly } from './softly.mjs';

// The secrets of the Worker of an environment that the setup sets (docs/189). The keys of the bots are
// never here: the owner puts them in himself (docs/32).
const BOTS = ['PASSENGER', 'DRIVER', 'ADMIN', 'SUPPORT', 'MAIN', 'POSTER'].map((bot) => `${bot}_BOT_TOKEN`);
const CALLS = ['REALTIME_APP_ID', 'REALTIME_APP_SECRET', 'TURN_KEY_ID', 'TURN_KEY_TOKEN'];
const IDS = /^\d+(,\d+)*$/u;
const WEBHOOK_BYTES = 32;
const scriptOf = (worker) => `/accounts/:account/workers/scripts/${worker}/secrets`;

// The names of the secrets of the Worker, or null before the first deploy made it.
async function secretNames(request, worker) {
  const secrets = await request('GET', scriptOf(worker));
  return secrets && secrets.map((secret) => secret.name);
}

// Voice calls (docs/08): an app and a TURN key of the account; their secrets come back only once.
async function callsSecrets(request, name) {
  const app = await request('POST', '/accounts/:account/calls/apps', { name });
  const turn = await request('POST', '/accounts/:account/calls/turn_keys', { name });
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
  const { worker, accountId, admins, calls, webhook, analyticsKey, setupBots } = options;
  const names = await secretNames(request, worker);
  if (!names) return [`worker ${worker}: none yet, run again after the first deploy`];
  const report = [];
  const put = async (name, text) => {
    await request('PUT', scriptOf(worker), { name, text, type: 'secret_text' });
    report.push(`worker ${worker}: ${name} set`);
  };
  if (!names.includes('CF_ACCOUNT_ID')) await put('CF_ACCOUNT_ID', accountId);
  if (admins !== undefined) {
    if (!IDS.test(admins)) throw new Error('keys: --admins takes Telegram ids with commas');
    await put('ADMIN_TELEGRAM_IDS', admins);
  }
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
      await setupBots(secret);
      report.push('bots: webhooks and looks set');
    }
  }
  return report;
}
