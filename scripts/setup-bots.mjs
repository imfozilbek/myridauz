// Points the bots at the deployed Worker (docs/45): pnpm run setup-bots --brand=<brand> --env=<environment>.
// Run after the first deploy and when bot settings change. Needs TELEGRAM_WEBHOOK_SECRET of that
// environment; bot tokens stay in Cloudflare secrets (docs/32). Then the looks of every channel come
// from the repository round by round, not in a day of the Cron (docs/180).
import { apiHost } from '../brands/index.ts';
import { targetOf } from './deploy/target.mjs';

// A round checks a few channels (docs/117): 68 channels take about 11 rounds.
const MAX_ROUNDS = 40;

const { brand } = targetOf('setup-bots');
const call = async (path) => {
  const response = await fetch(`https://${apiHost(brand)}${path}`, {
    method: 'POST',
    headers: { 'x-setup-secret': process.env.TELEGRAM_WEBHOOK_SECRET ?? '' },
  });
  if (!response.ok) throw new Error(`setup-bots ${path.split('?')[0]}: ${response.status}`);
  return response.json();
};

console.log(await call('/telegram/setup'));
const since = Date.now();
for (let round = 1; round <= MAX_ROUNDS; round += 1) {
  const { checked, left } = await call(`/telegram/looks?since=${since}`);
  console.log(`looks ${round}: ${checked.join(', ')}; left ${left}`);
  if (left === 0) process.exit(0);
}
throw new Error(`setup-bots: looks left after ${MAX_ROUNDS} rounds`);
