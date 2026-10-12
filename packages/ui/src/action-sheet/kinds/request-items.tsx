import { useDriverData } from '../../home/driver-data';
import { answerable } from '../../home/home-items';
import { useNow } from '../../own-trip/use-now';
import type { PlaceDirectory } from '../../places/directory';
import { useBalance } from '../../bookings/use-balance';
import type { ActionItem } from '../action-item';
import { useRequestItem, useSheetAnswer } from './request-item';

// The requests a driver can still answer, one sheet each (docs/122).
export function useRequestItems(directory: PlaceDirectory): ActionItem[] {
  const { value, refresh } = useDriverData();
  const now = useNow();
  const requests = (value?.[1] ?? []).filter((one) => answerable(one, now));
  // The wallet is checked here too (G75, docs/158 Г): short of the commission, the sum short and the
  // ready message to the support instead of a «Tasdiqlash» that fails.
  const { balance } = useBalance(requests.length > 0);
  const answer = useSheetAnswer(refresh);
  const item = useRequestItem(directory);
  return requests.map((booking) => item(booking, balance, answer));
}
