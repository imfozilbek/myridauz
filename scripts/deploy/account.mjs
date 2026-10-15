import { cloudflare } from './cloudflare.mjs';

// The secrets of a job belong to one account (docs/179): the account of an environment owns the
// domain of that environment. Any other account holds the secrets of the other environment, so the
// command stops before it creates or changes anything there.
export async function ensureAccountOf(brand, environment, request = cloudflare) {
  const zones = await request('GET', `/zones?name=${brand.domain}&account.id=:account`);
  if (!zones?.some((zone) => zone.name === brand.domain))
    throw new Error(
      `${environment}: the Cloudflare account has no zone ${brand.domain}, its secrets belong to another environment (docs/179)`,
    );
}
