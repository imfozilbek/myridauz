import { BOOKING_NOTE_MAX, type Booking, type Trip } from '@platform/contracts';
import { useState } from 'react';
import { useI18n } from '../context/i18n-context';
import type { SeatChoice } from '../find/seat-choice';
import { DraftRestored } from '../flow/draft-restored';
import { usePlaces } from '../market/places-gate';
import { CommentSheet } from '../market/trip-steps';
import { rememberedWay } from '../way/remembered-way';
import { BookPoint } from './book-point';
import { BookPoints } from './book-points';
import { useBooking } from './book-state';
import { PendingBooking } from './pending-booking';
import { useCancelSeat } from './use-cancel-seat';
import { ActionFailure } from '../states/action-failure';

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
  const directory = usePlaces();
  const [sent, setSent] = useState<Booking | null>(null);
  const last = rememberedWay(trip.from, trip.to, directory.find);
  const flow = useBooking(trip, last);
  if (sent) return <SentSeat booking={sent} onClose={onClose} onHome={onHome} />;
  const region = (id: string) => {
    const place = directory.find(id);
    return (place?.parentId ? directory.find(place.parentId) : place)?.name ?? id;
  };
  if (flow.screen === 'pickup' || flow.screen === 'dropoff') {
    const pickup = flow.screen === 'pickup';
    // The start chosen, the map of the end opens at once while the end is not chosen yet (G78 П4).
    const afterStart = flow.dropoff ? 'points' : 'dropoff';
    return (
      <BookPoint
        placeId={pickup ? trip.from : trip.to}
        end={pickup ? 'from' : 'to'}
        initial={pickup ? flow.pickup : flow.dropoff}
        // The pitak tile brings the pitak back; while it is the start it is not offered (mockup screen 8).
        {...(pickup && flow.pitakFirst && trip.pitak && flow.mode !== 'pitak'
          ? {
              pitak: trip.pitak,
              onPitak: () => flow.patch({ mode: 'pitak', pickup: null, screen: afterStart }),
            }
          : {})}
        onBack={() => flow.patch({ screen: 'points' })}
        onPick={(end) =>
          flow.patch(
            pickup ? { mode: 'door', pickup: end, screen: afterStart } : { dropoff: end, screen: 'points' },
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
        onOthers={onClose}
        onSent={(booking) => {
          flow.clear();
          setSent(booking);
        }}
      />
      {/* «Izoh» is a sheet over the booking (G75, mockup g75/3 A phone 3). */}
      <CommentSheet
        open={flow.screen === 'note'}
        initial={flow.note}
        hint={t('bookings.note.hint')}
        max={BOOKING_NOTE_MAX}
        onType={(note) => flow.patch({ note })}
        onClose={() => flow.patch({ screen: 'points' })}
        onDone={(note) => flow.patch({ note, screen: 'points' })}
      />
      <DraftRestored shown={flow.restored} />
    </>
  );
}

type SentProps = { readonly booking: Booking; readonly onClose: () => void; readonly onHome: () => void };

// The request just sent: its cancel is the one of the page of the seat (G77).
function SentSeat({ booking, onClose, onHome }: SentProps) {
  const { cancel, failure } = useCancelSeat(booking.id, { onDone: onClose });
  return (
    <PendingBooking booking={booking} onBack={onClose} onCancel={cancel} onHome={onHome}>
      <ActionFailure error={failure} />
    </PendingBooking>
  );
}
