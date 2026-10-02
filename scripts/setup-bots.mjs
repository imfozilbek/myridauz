// Points the bots at the deployed Worker (docs/45). Run after the first deploy and when bot settings change.
// Needs TELEGRAM_WEBHOOK_SECRET; bot tokens stay in Cloudflare secrets (docs/32).
import { apiHost, loadBrand } from '../brands/index.ts';

const brandArg = process.argv.find((arg) => arg.startsWith('--brand='));
const brand = loadBrand(brandArg?.split('=')[1]);
const response = await fetch(`https://${apiHost(brand)}/telegram/setup`, {
  method: 'POST',
  headers: { 'x-setup-secret': process.env.TELEGRAM_WEBHOOK_SECRET ?? '' },
});
if (!response.ok) throw new Error(`setup-bots: ${response.status}`);
console.log(await response.json());
