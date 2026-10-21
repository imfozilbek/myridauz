import { brandForApp } from '@platform/brands';
import type { Trip } from '@platform/contracts';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { usePlaceLabel } from '../market/places-gate';
import { useTripTime } from '../trip/trip-time';
import type { TripPictureTexts } from './trip-paint';

// The words of a picture of a trip in the language of the app (docs/88 L19, G88 docs/193).
// A picture of a trip goes to passengers: the colors of the passenger app their tap opens (docs/20).
export function usePassengerColors() {
  return brandForApp(useBrand(), 'passenger').theme.colors;
}

// The lines of value of the flyer under a picture (G88): «Raqamingiz yashirin», «Telegram ichida».
export function usePictureChecks(): readonly string[] {
  const { t } = useI18n();
  return [t('share.picture.hidden'), t('share.picture.telegram')];
}

export function useTripTexts() {
  const { t, formatDate, formatMoney } = useI18n();
  const tripTime = useTripTime();
  const brand = useBrand();
  const place = usePlaceLabel();
  const checks = usePictureChecks();
  return (trip: Trip): TripPictureTexts => {
    const values = {
      date: formatDate(new Date(trip.departAt)),
      time: tripTime(trip),
      seats: String(trip.seatsLeft),
    };
    return {
      title: t('share.storyTitle'),
      from: place(trip.from),
      to: place(trip.to),
      when: t('share.storyWhen', values),
      seats: t('drivers.seats.count', values),
      price: formatMoney(trip.price),
      button: t('market.trip.book'),
      brandName: brand.name,
      slogan: brand.slogan,
      checks,
    };
  };
}
