import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { shareCard } from '../telegram/share-card';

const SCREEN = 'bookings.passenger';

// «Yaqinlarimga yuborish» (docs/43): the card of the trip goes to the close people the person picks;
// share_done of the loop follow once it went (G88, docs/29).
export function useShareTrip() {
  const { track } = useAnalytics();
  const { chat } = useApiClients();
  return async (bookingId: string) => {
    const { preparedMessageId, link, text } = await chat.share(bookingId);
    track({ name: 'trip_shared', screen: SCREEN });
    if (await shareCard(preparedMessageId, link, text))
      track({ name: 'share_done', button: 'follow', screen: SCREEN, target: 'chat' });
  };
}
