import { useApiClients } from '../context/api-clients';
import { useLoad } from '../market/use-list';
import type { DirectionKind } from './direction-kinds';

// The cards of «Qayerga» from one place (G59): the busy directions, then the fixed order.
export function useDirections(kind: DirectionKind, from: string) {
  const { market } = useApiClients();
  return useLoad(() => kind.cards(market, from), `${kind.memory}:${from}`);
}
