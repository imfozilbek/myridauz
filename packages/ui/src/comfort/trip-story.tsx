import type { Trip } from '@platform/contracts';
import { useState } from 'react';
import { Cell } from '../components';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { usePlaceLabel } from '../market/places-gate';
import { haptic } from '../telegram/feedback';
import { canShareStory, openStory } from '../telegram/story';
import { drawStory } from './story-picture';

// «Hikoyaga joylash» (docs/88 L19): an open trip goes to the driver's Telegram story, friends book
// a seat from it. Only the route, the time, the seats and the price: never a name, car or phone.
type Props = { readonly trip: Trip; readonly onFailure: (error: unknown) => void };

export function TripStory(props: Props) {
  return props.trip.status === 'active' && canShareStory() ? <StoryCell {...props} /> : null;
}

function StoryCell({ trip, onFailure }: Props) {
  const { t, formatDate, formatTime, formatMoney } = useI18n();
  const { track } = useAnalytics();
  const { chat } = useApiClients();
  const brand = useBrand();
  const place = usePlaceLabel();
  const [busy, setBusy] = useState(false);
  const share = async () => {
    setBusy(true);
    try {
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
      track({ name: 'driver_trip_story', screen: 'market.trip' });
      haptic.success();
    } catch (caught) {
      haptic.error();
      onFailure(caught);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Cell
      before={<IconTile name="story" tone="accent" />}
      subtitle={t('share.storyHint')}
      disabled={busy}
      onClick={() => void share()}
    >
      {t('share.story')}
    </Cell>
  );
}
