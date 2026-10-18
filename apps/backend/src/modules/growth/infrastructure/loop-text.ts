import type { BrandConfig } from '@platform/brands';
import { tashkentDayStart } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Places } from '../../../shared/places/end-names';
import { tripShareText, tripShareWords } from '../../../shared/share/trip-text';
import { driverValue, passengerValue, withValue } from '../../../shared/share/value-lines';
import type { LoopInput } from '../application/loop-cards';
import type { CardMessage } from '../application/ports';

const { t, formatDate, formatTime } = createI18n(DEFAULT_LOCALE);
const nameOf = (id: string, places: Places) => places.get(id)?.name ?? id;

// The ready messages of the loops (docs/123): the route and the day, never a phone or a name. The last
// line says why the brand to the one who reads it (G88, docs/193): the drivers of a group, or a future
// passenger.
export function loopMessage(brand: BrandConfig, input: LoopInput, places: Places): CardMessage {
  if (input.loop === 'trip') return { text: tripShareText(input, places), words: tripShareWords() };
  const values = { brand: brand.name };
  if (input.loop === 'share-join') {
    return {
      text: withValue(t('growth.invite.text', values), passengerValue()),
      words: { title: t('growth.message.title', values), button: t('growth.link.join') },
    };
  }
  const route = {
    from: nameOf(input.from, places),
    to: nameOf(input.to, places),
    seats: String(input.seats),
  };
  if (input.loop === 'req-share') {
    const date = formatDate(new Date(tashkentDayStart(input.date)));
    return {
      text: t('growth.group.message', { ...route, date, value: driverValue(brand) }),
      words: { title: t('growth.group.messageTitle'), button: t('growth.group.link') },
    };
  }
  const day = new Date(input.departAt);
  const text = t('growth.seats.message', { ...route, date: formatDate(day), time: formatTime(day) });
  return {
    text: withValue(text, passengerValue()),
    words: { title: t('growth.seats.messageTitle'), button: t('market.trip.book') },
  };
}
