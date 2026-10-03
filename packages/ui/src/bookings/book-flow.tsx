import { BOOKING_LINK, commonModes, type Booking, type Trip } from '@platform/contracts';
import { useState } from 'react';
import { useI18n } from '../context/i18n-context';
import { DraftRestored } from '../flow/draft-restored';
import { useDirectory } from '../places/use-directory';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { rememberedWay, type RememberedWay } from '../way/remembered-way';
import { BookSent } from './book-sent';
import { useBooking } from './book-state';
import { BookStep } from './book-steps';
import '../market/market.css';

type Props = { readonly trip: Trip; readonly onBack: () => void; readonly onClose: () => void };

// A passenger books seats (G26, G35, docs/74, docs/97): the way only when the driver takes both,
// the point at the door only for «Uyimdan», the point at the end always, a check with the seats,
// sent. The way of the last trip on this route opens the check at once. After this nothing
// changes but a cancel (docs/70). Each step has its key: it opens with its own state (S1).
export function BookFlow({ trip, onBack, onClose }: Props) {
  const { t } = useI18n();
  const [places] = useDirectory();
  const [sent, setSent] = useState<Booking | null>(null);
  const [seeing, setSeeing] = useState(false);
  const ways = commonModes(trip.pickupMode, 'both').filter((way) => way === 'door' || trip.pitak !== null);
  // «Soʻrovni koʻrish» opens the sent request in «Mening safarlarim» (docs/89 P9).
  if (sent && seeing) return <MyRequestsScreen onBack={onClose} link={{ name: BOOKING_LINK, id: sent.id }} />;
  if (sent) return <BookSent booking={sent} onClose={onClose} onSee={() => setSeeing(true)} />;
  // A trip whose pitak is gone and that takes nobody at the door: nothing to book.
  if (ways.length === 0)
    return <ErrorScreen title={t('errors.generic.title')} onRetry={onBack} onBack={onBack} />;
  if (places.status === 'loading') return <ScreenSkeleton onBack={onBack} />;
  // Without the directory nothing kept can be read: the maps, as for a new person.
  const last = places.status === 'ready' ? rememberedWay(trip.from, trip.to, places.directory.find) : null;
  return <Steps trip={trip} ways={ways} last={last} onBack={onBack} onSent={setSent} />;
}

type StepsProps = {
  readonly trip: Trip;
  readonly ways: ReturnType<typeof commonModes>;
  readonly last: RememberedWay | null;
  readonly onBack: () => void;
  readonly onSent: (booking: Booking) => void;
};

function Steps({ trip, ways, last, onBack, onSent }: StepsProps) {
  const flow = useBooking(trip, ways, last);
  const booked = (booking: Booking) => {
    flow.clear();
    onSent(booking);
  };
  return (
    <>
      <BookStep key={flow.step} trip={trip} ways={ways} flow={flow} onBack={onBack} onSent={booked} />
      <DraftRestored shown={flow.restored} />
    </>
  );
}
