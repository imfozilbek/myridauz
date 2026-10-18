import type { Trip } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useShareTrack } from '../growth/use-share-track';
import { useTripTexts } from '../media/use-trip-texts';
import { haptic } from '../telegram/feedback';
import { shareCard } from '../telegram/share-card';
import { drawTripCardPicture } from './trip-card-picture';

// «Havolani yoʻlovchilarga yuborish» (G88, docs/193): the ready card of the trip with its picture from
// the driver bot; its link carries the driver's code (loop trip). No canvas or no picture kept: the
// card goes as text. A card that cannot be made shakes the phone and stays quiet.
export function useTripCard(trip: Trip) {
  const { growth } = useApiClients();
  const brand = useBrand();
  const texts = useTripTexts();
  const done = useShareTrack('trip', 'market.own_trip');
  const pictureId = async () => {
    const font = getComputedStyle(document.body).fontFamily;
    const picture = await drawTripCardPicture(texts(trip), brand.theme.colors, font);
    return picture ? growth.cardPicture(picture) : null;
  };
  return async () => {
    try {
      const picture = await pictureId().catch(() => null);
      const card = await growth.loopCard({ loop: 'trip', tripId: trip.id, ...(picture ? { picture } : {}) });
      if (!(await shareCard(card.prepared, card.link, card.text))) return;
      done('chat');
      haptic.success();
    } catch {
      haptic.error();
    }
  };
}
