import { tashkentDayStart } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { LoopInput } from '../application/loop-cards';
import type { CardMessage } from '../application/ports';

const { t, formatDate, formatTime } = createI18n(DEFAULT_LOCALE);

// The ready messages of the loops 2 and 3 (docs/123): the route and the day, never a phone or a name.
export async function loopMessage(
  input: LoopInput,
  placeName: (id: string) => Promise<string>,
): Promise<CardMessage> {
  const route = {
    from: await placeName(input.from),
    to: await placeName(input.to),
    seats: String(input.seats),
  };
  if (input.loop === 'req-share') {
    const date = formatDate(new Date(tashkentDayStart(input.date)));
    return {
      text: t('growth.group.message', { ...route, date }),
      words: { title: t('growth.group.messageTitle'), button: t('growth.group.link') },
    };
  }
  const day = new Date(input.departAt);
  return {
    text: t('growth.seats.message', { ...route, date: formatDate(day), time: formatTime(day) }),
    words: { title: t('growth.seats.messageTitle'), button: t('market.trip.book') },
  };
}
