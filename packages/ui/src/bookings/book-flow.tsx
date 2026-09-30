import { commonModes, type BookingMode, type Trip } from '@platform/contracts';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { useAnalytics } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { ChoiceStep } from '../driver/steps/choice-step';
import { MainButton } from '../telegram/bottom-button';
import type { Way } from '../way/way-end';
import { WayScreen } from '../way/way-screen';
import { BookReview } from './book-review';
import '../market/market.css';

// A person asks for more than 4 seats rarely; the car decides the rest (docs/35).
const MAX_ASKED = 4;
type Props = {
  readonly trip: Trip;
  // The start and the end chosen in the search; a trip opened by a link asks for them here.
  readonly way: Way | null;
  readonly onBack: () => void;
  readonly onClose: () => void;
};

// A passenger books seats (docs/35, docs/70): how many, the start and the end if not known yet,
// the way when both suit, a check with everything, sent. After this nothing changes but a cancel.
export function BookFlow({ trip, way: known, onBack, onClose }: Props) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const [seats, setSeats] = useState<number | null>(null);
  const [way, setWay] = useState<Way | null>(known);
  const [mode, setMode] = useState<BookingMode | null>(null);
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <StepLayout icon="selected" title={t('bookings.sent.title')} hint={t('bookings.sent.hint')}>
        <MainButton text={t('market.done')} onClick={onClose} />
      </StepLayout>
    );
  }
  if (seats === null) {
    const choices = Array.from({ length: Math.min(trip.seatsLeft, MAX_ASKED) }, (_, index) => ({
      value: index + 1,
      label: t('market.request.seats', { count: String(index + 1) }),
    }));
    return (
      <ChoiceStep
        screen="bookings.seats"
        icon="passengers"
        title={t('bookings.seats.title')}
        choices={choices}
        onBack={onBack}
        onDone={(value) => {
          track({ name: 'booking_step', screen: 'bookings.seats', step: 'seats' });
          setSeats(value);
        }}
      />
    );
  }
  if (!way) return <WayScreen done="common.continue" onBack={() => setSeats(null)} onDone={setWay} />;
  // «Pitakdan» needs the pitak of the direction; «Uyimdan» needs the point of the start.
  const ways = commonModes(trip.pickupMode, way.mode).filter((each) =>
    each === 'pitak' ? trip.pitak !== null : way.from.point !== null,
  );
  const chosen = mode ?? (ways.length === 1 ? ways[0] : null) ?? null;
  const back = () => (known ? setSeats(null) : setWay(null));
  if (!chosen && ways.length > 1) {
    const choices = ways.map((each) => ({
      value: each,
      label: t(`way.mode.${each}`),
      ...(each === 'pitak' && trip.pitak ? { after: trip.pitak.name } : {}),
    }));
    return (
      <ChoiceStep
        screen="bookings.mode"
        icon="origin"
        title={t('way.book.mode')}
        choices={choices}
        onBack={back}
        onDone={setMode}
      />
    );
  }
  return (
    <BookReview
      trip={trip}
      seats={seats}
      way={way}
      mode={chosen}
      onBack={() => (mode ? setMode(null) : back())}
      onSent={() => setSent(true)}
    />
  );
}
