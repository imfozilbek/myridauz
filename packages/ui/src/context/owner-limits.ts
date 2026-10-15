import type { LimitsClient } from '@platform/api-client';
import type { BrandConfig } from '@platform/brands';
import { withLimits, type OwnerLimits } from '@platform/contracts';
import { useEffect, useMemo, useState } from 'react';

// The limits the owner set in «Cheklovlar» (G75, docs/128 §4) over the brand config: the screens say
// what the server checks. Until they come, and if they do not, the brand defaults stay. The same answer
// tells whether calls are set up (G52): until then they are.
export function useOwnerLimits(brand: BrandConfig, limits: LimitsClient) {
  const [owner, setOwner] = useState<OwnerLimits>({ values: {} });
  useEffect(() => {
    let live = true;
    limits.current().then(
      (answer) => live && setOwner(answer),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [limits]);
  const limited = useMemo(() => withLimits(brand, owner.values), [brand, owner.values]);
  return { limited, calls: owner.calls ?? true };
}
