import { useApiClients } from '../context/api-clients';
import { useLoad } from '../market/use-list';

// The cards of «Qayerga borasiz?» from one place (G59): the busy directions, then the popular ones.
export function useDirections(from: string) {
  const { market } = useApiClients();
  return useLoad(() => market.directions(from), `directions:${from}`);
}
