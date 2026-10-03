import type { Booking, BookingMode, Trip } from '@platform/contracts';
import { useAnalytics } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { ChoiceStep } from '../driver/steps/choice-step';
import { IconTile } from '../icon-tile';
import { BookPoint } from './book-point';
import { BookReview } from './book-review';
import type { BookStepName, useBooking } from './book-state';

// A person asks for more than 4 seats rarely; the car decides the rest (docs/35).
const MAX_ASKED = 4;
type Props = {
  readonly trip: Trip;
  readonly ways: readonly BookingMode[];
  readonly flow: ReturnType<typeof useBooking>;
  readonly onBack: () => void;
  readonly onSent: (booking: Booking) => void;
};

// One step of a booking; each step shows the answer chosen before (docs/94 F8). The seats are in
// the check (G35, docs/97 K3); a step opened by «Oʻzgartirish» goes back to the check.
export function BookStep({ trip, ways, flow, onBack, onSent }: Props) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { step, seats, mode, pickup, dropoff, kept, editing, patch, answer } = flow;
  const passed = (name: 'mode' | 'pickup' | 'dropoff') =>
    track({ name: 'booking_step', screen: `bookings.${name}`, step: name });
  const go = (to: BookStepName) => () => patch({ step: to });
  const back = (to: BookStepName | null) => (editing ? go('review') : to ? go(to) : onBack);
  const choose = ways.length > 1 ? 'mode' : null;
  if (step === 'mode' || !mode)
    return (
      <ChoiceStep
        screen="bookings.mode"
        icon="origin"
        title={t('way.book.mode')}
        choices={ways.map((each) => ({
          value: each,
          label: t(`way.mode.${each}`),
          before: <IconTile name={each === 'door' ? 'door' : 'pitak'} />,
          ...(each === 'pitak' && trip.pitak ? { subtitle: trip.pitak.name } : {}),
        }))}
        {...(mode ? { selected: mode } : {})}
        onBack={back(null)}
        onDone={(value) => {
          passed('mode');
          // «Uyimdan» always shows its point: a new one, or the kept one to check.
          if (value === 'door') patch({ mode: value, step: 'pickup' });
          else answer({ mode: value, pickup: null });
        }}
      />
    );
  if (step === 'pickup' || (mode === 'door' && !pickup))
    return (
      <BookPoint
        placeId={trip.from}
        end="from"
        initial={pickup}
        onBack={back(choose)}
        onPick={(end) => {
          passed('pickup');
          answer({ pickup: end });
        }}
      />
    );
  if (step === 'dropoff' || !dropoff)
    return (
      <BookPoint
        placeId={trip.to}
        end="to"
        initial={dropoff}
        onBack={back(mode === 'door' ? 'pickup' : choose)}
        onPick={(end) => {
          passed('dropoff');
          answer({ dropoff: end });
        }}
      />
    );
  // The start changes by the way when the trip takes both, by the map for the door alone.
  const start: BookStepName | null = ways.length > 1 ? 'mode' : mode === 'door' ? 'pickup' : null;
  return (
    <BookReview
      trip={trip}
      seats={seats}
      most={Math.min(trip.seatsLeft, MAX_ASKED)}
      mode={mode}
      pickup={mode === 'door' ? pickup : null}
      dropoff={dropoff}
      onSeats={(value) => patch({ seats: value })}
      {...(start ? { onStart: () => patch({ step: start, editing: true }) } : {})}
      onDropoff={() => patch({ step: 'dropoff', editing: true })}
      onBack={kept ? onBack : go('dropoff')}
      onSent={onSent}
    />
  );
}
