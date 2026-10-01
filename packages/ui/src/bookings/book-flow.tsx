import { commonModes, type BookingMode, type Trip } from '@platform/contracts';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { useAnalytics } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { ChoiceStep } from '../driver/steps/choice-step';
import { ErrorScreen } from '../states/error-screen';
import { MainButton } from '../telegram/bottom-button';
import type { WayEnd } from '../way/way-end';
import { BookPoint } from './book-point';
import { BookReview } from './book-review';
import '../market/market.css';

// A person asks for more than 4 seats rarely; the car decides the rest (docs/35).
const MAX_ASKED = 4;
type Props = { readonly trip: Trip; readonly onBack: () => void; readonly onClose: () => void };
type Step = 'seats' | 'mode' | 'pickup' | 'dropoff' | 'review';

// A passenger books seats (G26, docs/74): how many, the way only when the driver takes both, the
// point at the door only for «Uyimdan», the point at home always, a check, sent. After this
// nothing changes but a cancel (docs/70).
export function BookFlow({ trip, onBack, onClose }: Props) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const ways = commonModes(trip.pickupMode, 'both').filter((way) => way === 'door' || trip.pitak !== null);
  const [step, setStep] = useState<Step>('seats');
  const [seats, setSeats] = useState(1);
  const [mode, setMode] = useState<BookingMode | null>(ways.length === 1 ? (ways[0] ?? null) : null);
  const [pickup, setPickup] = useState<WayEnd | null>(null);
  const [dropoff, setDropoff] = useState<WayEnd | null>(null);
  const [sent, setSent] = useState(false);
  const passed = (name: 'seats' | 'mode' | 'pickup' | 'dropoff') =>
    track({ name: 'booking_step', screen: `bookings.${name}`, step: name });
  const afterWay = (way: BookingMode) => (way === 'door' ? 'pickup' : 'dropoff');
  if (sent)
    return (
      <StepLayout icon="selected" title={t('bookings.sent.title')} hint={t('bookings.sent.hint')}>
        <MainButton text={t('market.done')} onClick={onClose} />
      </StepLayout>
    );
  // A trip whose pitak is gone and that takes nobody at the door: nothing to book.
  if (ways.length === 0)
    return <ErrorScreen title={t('errors.generic.title')} onRetry={onBack} onBack={onBack} />;
  if (step === 'seats')
    return (
      <ChoiceStep
        screen="bookings.seats"
        icon="passengers"
        title={t('bookings.seats.title')}
        choices={Array.from({ length: Math.min(trip.seatsLeft, MAX_ASKED) }, (_, index) => ({
          value: index + 1,
          label: t('market.request.seats', { count: String(index + 1) }),
        }))}
        onBack={onBack}
        onDone={(value) => {
          passed('seats');
          setSeats(value);
          setStep(mode ? afterWay(mode) : 'mode');
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
        onBack={() => setStep('seats')}
        onDone={(value) => {
          passed('mode');
          setMode(value);
          setStep(afterWay(value));
        }}
      />
    );
  const beforeDropoff: Step = mode === 'door' ? 'pickup' : ways.length > 1 ? 'mode' : 'seats';
  if (step === 'pickup')
    return (
      <BookPoint
        placeId={trip.from}
        end="from"
        onBack={() => setStep(ways.length > 1 ? 'mode' : 'seats')}
        onPick={(end) => {
          passed('pickup');
          setPickup(end);
          setStep('dropoff');
        }}
      />
    );
  if (step === 'dropoff' || !dropoff)
    return (
      <BookPoint
        placeId={trip.to}
        end="to"
        onBack={() => setStep(beforeDropoff)}
        onPick={(end) => {
          passed('dropoff');
          setDropoff(end);
          setStep('review');
        }}
      />
    );
  return (
    <BookReview
      trip={trip}
      seats={seats}
      mode={mode}
      pickup={mode === 'door' ? pickup : null}
      dropoff={dropoff}
      onBack={() => setStep('dropoff')}
      onSent={() => setSent(true)}
    />
  );
}
