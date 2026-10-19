import type { Trip } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useRef, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useShareTrack } from '../growth/use-share-track';
import { errorKey } from '../market/error-text';
import { usePictureFont } from '../media/picture-font';
import { usePassengerColors, useTripTexts } from '../media/use-trip-texts';
import { haptic } from '../telegram/feedback';
import { shareCard } from '../telegram/share-card';
import { drawTripCardPicture } from './trip-card-picture';

// «Havolani yoʻlovchilarga yuborish» (G88, docs/193): the ready card of the trip with its picture from
// the driver bot; its link carries the driver's code (loop trip). No canvas or no picture kept: the
// card goes as text. One card at a time: a second tap while the first runs sends nothing (docs/65 A4);
// a card that cannot be made says why.
export function useTripCard(trip: Trip) {
  const { growth } = useApiClients();
  const colors = usePassengerColors();
  const texts = useTripTexts();
  const pictureFont = usePictureFont();
  const done = useShareTrack('trip', 'market.own_trip');
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  const running = useRef(false);
  const pictureId = async () => {
    const picture = await drawTripCardPicture(texts(trip), colors, await pictureFont());
    return picture ? growth.cardPicture(picture) : null;
  };
  const send = async () => {
    if (running.current) return;
    running.current = true;
    setFailure(null);
    try {
      const picture = await pictureId().catch(() => null);
      const card = await growth.loopCard({ loop: 'trip', tripId: trip.id, ...(picture ? { picture } : {}) });
      if (!(await shareCard(card.prepared, card.link, card.text))) return;
      done('chat');
      haptic.success();
    } catch (caught) {
      setFailure(errorKey(caught));
    } finally {
      running.current = false;
    }
  };
  return { send, failure };
}
