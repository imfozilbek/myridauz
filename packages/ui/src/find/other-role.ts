import { useAccount } from '../account/account-context';
import type { FaceRole } from './person-badge';

// The other side of a trip: the passengers of a driver, the driver of a passenger (docs/172).
export function useOtherRole(): FaceRole {
  return useAccount()?.app === 'driver' ? 'passenger' : 'driver';
}
