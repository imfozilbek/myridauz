import type { LimitsClient } from '@platform/api-client';
import type { BrandConfig } from '@platform/brands';
import { withLimits, type OwnerLimits } from '@platform/contracts';
import { useEffect, useMemo, useState } from 'react';

// The limits the owner set in «Cheklovlar» (G75, docs/128 §4) over the brand config: the screens say
// what the server checks. Until they come, and if they do not, the brand defaults stay.
export function useOwnerLimits(brand: BrandConfig, limits: LimitsClient): BrandConfig {
  const [values, setValues] = useState<OwnerLimits['values']>({});
  useEffect(() => {
    let live = true;
    limits.current().then(
      (owner) => live && setValues(owner.values),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [limits]);
  return useMemo(() => withLimits(brand, values), [brand, values]);
}
