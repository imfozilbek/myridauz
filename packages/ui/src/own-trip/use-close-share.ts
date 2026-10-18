import { useRef, useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { haptic } from '../telegram/feedback';
import { shareCard } from '../telegram/share-card';

const SCREEN = 'market.own_trip';

// «Yaqinlarimga» of the driver (docs/43, G18): the card of the trip goes to the family the same way
// a passenger sends it, never a phone; then «Ulashishni toʻxtatish» under the tiles. One action at a
// time: a second tap while the first runs sends nothing (docs/65 A4). share_done of the loop follow
// once it went (G88, docs/29).
export function useCloseShare(tripId: string, fail: (caught: unknown) => void) {
  const { track } = useAnalytics();
  const { chat } = useApiClients();
  const [told, setTold] = useState<'told' | 'stopped' | null>(null);
  const running = useRef(false);
  const run = async (action: () => Promise<void>, after: 'told' | 'stopped') => {
    if (running.current) return;
    running.current = true;
    try {
      await action();
      haptic.success();
      setTold(after);
    } catch (caught) {
      // A trip that left cannot be shared any more: the driver reads why (docs/86 T4).
      fail(caught);
    } finally {
      running.current = false;
    }
  };
  return {
    told,
    share: () =>
      run(async () => {
        const { preparedMessageId, link, text } = await chat.shareTrip(tripId);
        track({ name: 'driver_trip_shared', screen: SCREEN });
        if (await shareCard(preparedMessageId, link, text))
          track({ name: 'share_done', button: 'follow', screen: SCREEN, target: 'chat' });
      }, 'told'),
    stop: () => run(() => chat.stopTripSharing(tripId), 'stopped'),
  };
}
