import { BOOKING_LINK, commonModes, type Booking, type Trip } from '@platform/contracts';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { useI18n } from '../context/i18n-context';
import { DraftRestored } from '../flow/draft-restored';
import { ErrorScreen } from '../states/error-screen';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { useBooking } from './book-state';
import { BookStep } from './book-steps';
import '../market/market.css';

type Props = { readonly trip: Trip; readonly onBack: () => void; readonly onClose: () => void };

// A passenger books seats (G26, docs/74): how many, the way only when the driver takes both, the
// point at the door only for «Uyimdan», the point at home always, a check, sent. After this
// nothing changes but a cancel (docs/70). Each step has its key: it opens with its own state (S1).
export function BookFlow({ trip, onBack, onClose }: Props) {
  const { t } = useI18n();
  const ways = commonModes(trip.pickupMode, 'both').filter((way) => way === 'door' || trip.pitak !== null);
  const flow = useBooking(trip, ways);
  const [sent, setSent] = useState<Booking | null>(null);
  const [seeing, setSeeing] = useState(false);
  // «Soʻrovni koʻrish» opens the sent request in «Mening safarlarim» (docs/89 P9).
  if (sent && seeing) return <MyRequestsScreen onBack={onClose} link={{ name: BOOKING_LINK, id: sent.id }} />;
  if (sent)
    return (
      <StepLayout icon="selected" title={t('bookings.sent.title')} hint={t('bookings.sent.hint')}>
        <Screen onBack={onClose} />
        <MainButton text={t('bookings.sent.see')} onClick={() => setSeeing(true)} />
      </StepLayout>
    );
  // A trip whose pitak is gone and that takes nobody at the door: nothing to book.
  if (ways.length === 0)
    return <ErrorScreen title={t('errors.generic.title')} onRetry={onBack} onBack={onBack} />;
  const booked = (booking: Booking) => {
    flow.clear();
    setSent(booking);
  };
  return (
    <>
      <BookStep key={flow.step} trip={trip} ways={ways} flow={flow} onBack={onBack} onSent={booked} />
      <DraftRestored shown={flow.restored} />
    </>
  );
}
