import type { Trip } from '@platform/contracts';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { usePlaceLabel } from '../market/places-gate';
import { haptic } from '../telegram/feedback';
import { openStory } from '../telegram/story';
import { drawStory } from './story-picture';

// «Hikoyaga» (docs/88 L19): an open trip goes to the driver's Telegram story, friends book a seat
// from it. Only the route, the time, the seats and the price: never a name, car or phone. When it
// cannot go, the tile says why (tileBlock of «Mening safarim»).
export function useTripStory(trip: Trip) {
  const { t, formatDate, formatTime, formatMoney } = useI18n();
  const { track } = useAnalytics();
  const { chat } = useApiClients();
  const brand = useBrand();
  const place = usePlaceLabel();
  return async () => {
    const from = place(trip.from);
    const to = place(trip.to);
    const day = new Date(trip.departAt);
    const values = { date: formatDate(day), time: formatTime(day), seats: String(trip.seatsLeft) };
    const picture = await drawStory(
      {
        title: t('share.storyTitle'),
        from,
        to,
        when: t('share.storyWhen', values),
        seats: t('drivers.seats.count', values),
        price: formatMoney(trip.price),
        button: t('market.trip.book'),
        brandName: brand.name,
        slogan: brand.slogan,
      },
      brand.theme.colors,
      getComputedStyle(document.body).fontFamily,
    );
    if (!picture) throw new Error('ui.story_not_drawn');
    const story = await chat.putTripStory(trip.id, picture);
    const text = t('share.storyCaption', { ...values, from: from.name, to: to.name, link: story.bookLink });
    openStory(story.imageUrl, text, { url: story.bookLink, name: t('market.trip.book') });
    track({ name: 'driver_trip_story', screen: 'market.own_trip' });
    haptic.success();
  };
}
