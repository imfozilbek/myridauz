import { commissionFor } from '@platform/brands';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useLoad } from '../market/use-list';

// «Qoldi ≈ 11 joyga yetadi» (mockup g63/4 screen 15): how many seats of this price the wallet still
// confirms, by the rule of the brand (docs/12); null until the wallet comes.
export function useSeatsLeft(price: number): number | null {
  const { wallet } = useApiClients();
  const { commission } = useBrand();
  const { value } = useLoad(() => wallet.mine());
  if (!value) return null;
  return Math.floor((value.bonus + value.main) / commissionFor(commission, price, 1));
}
