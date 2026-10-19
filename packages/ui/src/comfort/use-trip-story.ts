import type { Trip } from '@platform/contracts';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { usePictureFont } from '../media/picture-font';
import { usePassengerColors, useTripTexts } from '../media/use-trip-texts';
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
  const colors = usePassengerColors();
  const texts = useTripTexts();
  const pictureFont = usePictureFont();
  return async () => {
    const words = texts(trip);
    const picture = await drawStory(words, colors, await pictureFont());
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
    // share_shown of the story comes with the tiles, the only place of its button (OwnTripTiles).
    track({ name: 'share_done', button: 'story', screen: SCREEN, target: 'story' });
    haptic.success();
  };
}
