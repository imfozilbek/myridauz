import type { Booking } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { CellValue } from '../account/cell-value';
import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';

// The way of a seat, step by step (docs/88 L6): asked, confirmed, in the car, arrived.
const STEPS: readonly (readonly [TranslationKey, (booking: Booking) => number | null])[] = [
  ['chat.system.requested', (booking) => booking.createdAt],
  ['chat.system.confirmed', (booking) => booking.confirmedAt],
  ['share.follow.status.boarded', (booking) => booking.boardedAt],
  ['share.follow.status.arrived', (booking) => booking.arrivedAt],
];

// The steps a seat went through, with their time.
export const doneSteps = (booking: Booking) =>
  STEPS.flatMap(([label, at]) => {
    const time = at(booking);
    return time === null ? [] : [{ label, time }];
  });

// The steps done, as rows of «Joylar» in one card (G78 sheet 3, d-seat).
export function BookingSteps({ booking }: { readonly booking: Booking }) {
  const { t, formatDate, formatTime } = useI18n();
  const steps = doneSteps(booking);
  if (steps.length === 0) return null;
  return (
    <Section>
      {steps.map(({ label, time }) => (
        <Cell
          key={label}
          after={<CellValue>{`${formatDate(new Date(time))}, ${formatTime(new Date(time))}`}</CellValue>}
        >
          {t(label)}
        </Cell>
      ))}
    </Section>
  );
}
