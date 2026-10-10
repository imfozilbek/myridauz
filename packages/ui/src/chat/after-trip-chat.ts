import { afterTrip, arrivalAt, type ChatAbout, type ChatMessage } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useUntilText } from '../trip/until-text';
import { useBrand } from '../context/brand-context';

// The chat after the trip (docs/129, mockup g60/7): where «Safar tugadi» stands among the messages
// and the field that says until when one can write.
export function useAfterTripChat(about: ChatAbout | null, messages: readonly ChatMessage[]) {
  const { t } = useI18n();
  const untilText = useUntilText();
  const brand = useBrand();
  const booking = about?.booking ?? null;
  if (!booking || booking.status !== 'completed') return { endAt: -1, placeholder: t('chat.placeholder') };
  const { departAt, km } = booking.trip;
  const ended = arrivalAt(departAt, km);
  const now = Date.now();
  const { talkUntil } = afterTrip(brand, departAt, km, booking.trip.arrivedAt);
  const later = messages.findIndex((message) => message.at > ended);
  return {
    endAt: later === -1 ? messages.length : later,
    placeholder:
      now < talkUntil
        ? t('chat.placeholderUntil', { until: untilText(talkUntil, now) })
        : t('chat.placeholder'),
  };
}
