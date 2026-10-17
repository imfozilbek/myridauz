import { cloudflare } from './cloudflare.mjs';

// The secrets of the account, from the GitHub Environment of the job (docs/179).
const SECRETS = ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'];

// The secrets of a job belong to one account (docs/179): the account of an environment owns the
// domain of that environment. Any other account holds the secrets of the other environment, so the
// command stops before it creates or changes anything there. Empty secrets stop it first, by name.
// Gives the zone of the domain: the setup of the keys needs its id (docs/189).
export async function ensureAccountOf(brand, environment, request = cloudflare, env = process.env) {
  const missing = SECRETS.filter((name) => !env[name]);
  if (missing.length > 0)
    throw new Error(
      `${environment}: ${missing.join(' and ')} empty, add them to the GitHub Environment ${environment} (docs/179)`,
    );
  const zones = await request('GET', `/zones?name=${brand.domain}&account.id=:account`);
  const zone = zones?.find((one) => one.name === brand.domain);
  if (!zone)
    throw new Error(
      `${environment}: the Cloudflare account has no zone ${brand.domain}, its secrets belong to another environment (docs/179)`,
    );
  return zone;
}
