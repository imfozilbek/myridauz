import type { Trip } from '@platform/contracts';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { useShareTrack } from '../growth/use-share-track';
import { useTripTexts } from '../media/use-trip-texts';
import { haptic } from '../telegram/feedback';
import { openStory } from '../telegram/story';
import { drawStory } from './story-picture';

const SCREEN = 'market.own_trip';

// «Hikoyaga» (docs/88 L19): an open trip goes to the driver's Telegram story, friends book a seat
// from it; its link carries the driver's code (loop story, G88 docs/193). Only the route, the time,
// the seats and the price: never a name, car or phone. When it cannot go, the tile says why
// (tileBlock of «Mening safarim»).
export function useTripStory(trip: Trip) {
  const { t, formatDate, formatTime } = useI18n();
  const { track } = useAnalytics();
  const { chat } = useApiClients();
  const brand = useBrand();
  const texts = useTripTexts();
  const done = useShareTrack('story', SCREEN);
  return async () => {
    const words = texts(trip);
    const picture = await drawStory(words, brand.theme.colors, getComputedStyle(document.body).fontFamily);
    if (!picture) throw new Error('ui.story_not_drawn');
    const story = await chat.putTripStory(trip.id, picture);
    const day = new Date(trip.departAt);
    // Short: an ordinary account has 200 signs for the words of a story, and the link is long (G88).
    const text = t('share.storyCaption', {
      from: words.from.name,
      to: words.to.name,
      date: formatDate(day),
      time: formatTime(day),
      link: story.bookLink,
    });
    openStory(story.imageUrl, text, { url: story.bookLink, name: words.button });
    track({ name: 'driver_trip_story', screen: SCREEN });
    done('story');
    haptic.success();
  };
}
