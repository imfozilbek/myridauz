import type { Booking } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { Section, Timeline } from '../components';
import { useI18n } from '../context/i18n-context';

// The way of a booking, step by step with its time (docs/88 L6): asked, confirmed, in the car, arrived.
const STEPS: readonly (readonly [TranslationKey, (booking: Booking) => number | null])[] = [
  ['chat.system.requested', (booking) => booking.createdAt],
  ['chat.system.confirmed', (booking) => booking.confirmedAt],
  ['share.follow.status.boarded', (booking) => booking.boardedAt],
  ['share.follow.status.arrived', (booking) => booking.arrivedAt],
];
const LIVE = new Set<Booking['status']>(['requested', 'confirmed', 'completed']);

export function BookingTimeline({ booking }: { readonly booking: Booking }) {
  const { t, formatDate, formatTime } = useI18n();
  if (!LIVE.has(booking.status)) return null;
  // The last step with a time; a confirmed booking from before the times were kept is still confirmed.
  const timed = STEPS.findLastIndex(([, at]) => at(booking) !== null);
  const active = booking.status === 'requested' ? 0 : Math.max(timed, 1);
  return (
    <Section>
      <Timeline active={active} aria-label={t('market.review.status')}>
        {STEPS.map(([label, at]) => {
          const time = at(booking);
          return (
            <Timeline.Item key={label} header={t(label)}>
              {time === null ? null : `${formatDate(new Date(time))}, ${formatTime(new Date(time))}`}
            </Timeline.Item>
          );
        })}
      </Timeline>
    </Section>
  );
}
