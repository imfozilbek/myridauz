import type { Booking } from '@platform/contracts';
import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';

// Until when the driver answers a waiting seat: the driver knows the deadline, the passenger knows
// how long to wait (docs/35, U4).
export function AnswerDeadline({ booking }: { readonly booking: Booking }) {
  const { t, formatDate, formatTime } = useI18n();
  if (booking.status !== 'requested') return null;
  const until = new Date(booking.expiresAt);
  return (
    <Section>
      <Cell before={<IconTile name="history" />} after={formatDate(until) + ', ' + formatTime(until)}>
        {t('bookings.answerUntil')}
      </Cell>
    </Section>
  );
}
