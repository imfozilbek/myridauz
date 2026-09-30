import type { PublicDirection } from '@platform/contracts';
import type { PricingDeps } from './ports';
import { recommendPrice } from './recommend';

// The prices of the main directions for the landing (docs/59): the same recommendation as in
// the Mini Apps, so the site never shows another number.
export async function publicDirections(deps: PricingDeps): Promise<PublicDirection[]> {
  const rows = await Promise.all(
    deps.mainDirections.map(async ([from, to]) => {
      const result = await recommendPrice(deps, from, to);
      return result.ok ? { from, to, km: result.value.km, price: result.value.price } : null;
    }),
  );
  return rows.filter((row) => row !== null);
}
