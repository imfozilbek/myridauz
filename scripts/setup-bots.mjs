// Points the bots at the deployed Worker (docs/45): pnpm run setup-bots --brand=<brand> --env=<environment>.
// Run after the first deploy and when bot settings change. Needs TELEGRAM_WEBHOOK_SECRET of that
// environment; bot tokens stay in Cloudflare secrets (docs/32).
import { apiHost } from '../brands/index.ts';
import { targetOf } from './deploy/target.mjs';

const { brand } = targetOf('setup-bots');
const response = await fetch(`https://${apiHost(brand)}/telegram/setup`, {
  method: 'POST',
  headers: { 'x-setup-secret': process.env.TELEGRAM_WEBHOOK_SECRET ?? '' },
});
if (!response.ok) throw new Error(`setup-bots: ${response.status}`);
console.log(await response.json());
