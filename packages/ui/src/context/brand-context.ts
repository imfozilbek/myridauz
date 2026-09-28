import type { BrandConfig } from '@platform/brands';
import { createContext, useContext } from 'react';

export const BrandContext = createContext<BrandConfig | null>(null);

export function useBrand(): BrandConfig {
  const brand = useContext(BrandContext);
  if (!brand) throw new Error('ui.brand_missing');
  return brand;
}
