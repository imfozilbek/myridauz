import type { Booking, BookingMode, Trip } from '@platform/contracts';
import { useAnalytics } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { ChoiceStep } from '../driver/steps/choice-step';
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

// One step of a booking; each step shows the answer chosen before (docs/94 F8).
export function BookStep({ trip, ways, flow, onBack, onSent }: Props) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { step, seats, mode, pickup, dropoff, patch } = flow;
  const passed = (name: 'seats' | 'mode' | 'pickup' | 'dropoff') =>
    track({ name: 'booking_step', screen: `bookings.${name}`, step: name });
  const afterWay = (way: BookingMode): BookStepName => (way === 'door' ? 'pickup' : 'dropoff');
  const go = (to: BookStepName) => () => patch({ step: to });
  const most = Math.min(trip.seatsLeft, MAX_ASKED);
  if (step === 'seats')
    return (
      <ChoiceStep
        screen="bookings.seats"
        icon="passengers"
        title={t('bookings.seats.title')}
        choices={Array.from({ length: most }, (_, index) => ({
          value: index + 1,
          label: t('market.request.seats', { count: String(index + 1) }),
        }))}
        {...(seats !== null && seats <= most ? { selected: seats } : {})}
        onBack={onBack}
        onDone={(value) => {
          passed('seats');
          patch({ seats: value, step: mode ? afterWay(mode) : 'mode' });
        }}
      />
    );
  if (step === 'mode' || !mode)
    return (
      <ChoiceStep
        screen="bookings.mode"
        icon="origin"
        title={t('way.book.mode')}
        choices={ways.map((each) => ({
          value: each,
          label: t(`way.mode.${each}`),
          ...(each === 'pitak' && trip.pitak ? { after: trip.pitak.name } : {}),
        }))}
        {...(mode ? { selected: mode } : {})}
        onBack={go('seats')}
        onDone={(value) => {
          passed('mode');
          patch({ mode: value, step: afterWay(value) });
        }}
      />
    );
  const beforeDropoff: BookStepName = mode === 'door' ? 'pickup' : ways.length > 1 ? 'mode' : 'seats';
  if (step === 'pickup')
    return (
      <BookPoint
        placeId={trip.from}
        end="from"
        initial={pickup}
        onBack={go(ways.length > 1 ? 'mode' : 'seats')}
        onPick={(end) => {
          passed('pickup');
          patch({ pickup: end, step: 'dropoff' });
        }}
      />
    );
  if (step === 'dropoff' || !dropoff)
    return (
      <BookPoint
        placeId={trip.to}
        end="to"
        initial={dropoff}
        onBack={go(beforeDropoff)}
        onPick={(end) => {
          passed('dropoff');
          patch({ dropoff: end, step: 'review' });
        }}
      />
    );
  return (
    <BookReview
      trip={trip}
      seats={seats ?? 1}
      mode={mode}
      pickup={mode === 'door' ? pickup : null}
      dropoff={dropoff}
      onBack={go('dropoff')}
      onSent={onSent}
    />
  );
}
