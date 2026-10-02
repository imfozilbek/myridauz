import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { shareCard } from '../telegram/share-card';

// «Yaqinlarimga yuborish» (docs/43): the card of the trip goes to the close people the person picks.
export function useShareTrip() {
  const { track } = useAnalytics();
  const { chat } = useApiClients();
  return async (bookingId: string) => {
    const { preparedMessageId, link } = await chat.share(bookingId);
    track({ name: 'trip_shared', screen: 'bookings.passenger' });
    await shareCard(preparedMessageId, link);
  };
}
