import { useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { haptic } from '../telegram/feedback';
import { shareCard } from '../telegram/share-card';

// «Yaqinlarimga» of the driver (docs/43, G18): the card of the trip goes to the family the same way
// a passenger sends it, never a phone; then «Ulashishni toʻxtatish» under the tiles.
export function useCloseShare(tripId: string, fail: (caught: unknown) => void) {
  const { track } = useAnalytics();
  const { chat } = useApiClients();
  const [told, setTold] = useState<'told' | 'stopped' | null>(null);
  const run = async (action: () => Promise<void>, after: 'told' | 'stopped') => {
    try {
      await action();
      haptic.success();
      setTold(after);
    } catch (caught) {
      // A trip that left cannot be shared any more: the driver reads why (docs/86 T4).
      fail(caught);
    }
  };
  return {
    told,
    share: () =>
      run(async () => {
        const { preparedMessageId, link } = await chat.shareTrip(tripId);
        track({ name: 'driver_trip_shared', screen: 'market.own_trip' });
        await shareCard(preparedMessageId, link);
      }, 'told'),
    stop: () => run(() => chat.stopTripSharing(tripId), 'stopped'),
  };
}
