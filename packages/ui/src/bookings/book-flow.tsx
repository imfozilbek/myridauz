import { BOOKING_NOTE_MAX, type Booking, type Trip } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import type { SeatChoice } from '../find/seat-choice';
import { DraftRestored } from '../flow/draft-restored';
import { usePlaces } from '../market/places-gate';
import { CommentStep } from '../market/trip-steps';
import { confirm, haptic } from '../telegram/feedback';
import { rememberedWay } from '../way/remembered-way';
import { BookPoint } from './book-point';
import { BookPoints } from './book-points';
import { useBooking } from './book-state';
import { PendingBooking } from './pending-booking';

type Props = {
  readonly trip: Trip;
  readonly choice: SeatChoice;
  readonly onBack: () => void;
  // Back to the trips after a cancel; «Bosh sahifa» of the sent request.
  readonly onClose: () => void;
  readonly onHome: () => void;
};

// A passenger books (G59, docs/118 path 2): the seats came from «Safar», here only where from and
// where to on one screen, then at once the page of the request. After this nothing changes but a
// cancel (docs/70). Inside the places gate: the names of the places come from the directory.
export function BookFlow({ trip, choice, onBack, onClose, onHome }: Props) {
  const { t } = useI18n();
  const { bookings } = useApiClients();
  const directory = usePlaces();
  const [sent, setSent] = useState<Booking | null>(null);
  const last = rememberedWay(trip.from, trip.to, directory.find);
  const flow = useBooking(trip, last);
  if (sent) {
    // A cancel is asked first: one tap never loses a seat (docs/65 B4).
    const cancel = async () => {
      if (!(await confirm(t('bookings.cancelAsk'), t('market.request.cancel')))) return;
      await bookings.cancelMine(sent.id).then(onClose, () => haptic.error());
    };
    return <PendingBooking booking={sent} onBack={onClose} onCancel={() => void cancel()} onHome={onHome} />;
  }
  const region = (id: string) => {
    const place = directory.find(id);
    return (place?.parentId ? directory.find(place.parentId) : place)?.name ?? id;
  };
  if (flow.screen === 'note')
    return (
      <CommentStep
        initial={flow.note}
        hint={t('bookings.note.hint')}
        max={BOOKING_NOTE_MAX}
        onType={(note) => flow.patch({ note })}
        onBack={() => flow.patch({ screen: 'points' })}
        onDone={(note) => flow.patch({ note, screen: 'points' })}
      />
    );
  if (flow.screen === 'pickup' || flow.screen === 'dropoff') {
    const pickup = flow.screen === 'pickup';
    return (
      <BookPoint
        placeId={pickup ? trip.from : trip.to}
        end={pickup ? 'from' : 'to'}
        initial={pickup ? flow.pickup : flow.dropoff}
        // The pitak tile brings the pitak back; while it is the start it is not offered (mockup screen 8).
        {...(pickup && flow.pitakFirst && trip.pitak && flow.mode !== 'pitak'
          ? {
              pitak: trip.pitak,
              onPitak: () => flow.patch({ mode: 'pitak', pickup: null, screen: 'points' }),
            }
          : {})}
        onBack={() => flow.patch({ screen: 'points' })}
        onPick={(end) =>
          flow.patch(
            pickup ? { mode: 'door', pickup: end, screen: 'points' } : { dropoff: end, screen: 'points' },
          )
        }
      />
    );
  }
  return (
    <>
      <BookPoints
        trip={trip}
        choice={choice}
        flow={flow}
        route={t('common.route', { from: region(trip.from), to: region(trip.to) })}
        onBack={onBack}
        onSent={(booking) => {
          flow.clear();
          setSent(booking);
        }}
      />
      <DraftRestored shown={flow.restored} />
    </>
  );
}
