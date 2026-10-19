import { BOOKING_NOTE_MAX, type Pitak, type Recommendation } from '@platform/contracts';
import { useState } from 'react';
import { NoteRow } from '../bookings/note-row';
import { PointsScreen, usePassengerWords } from '../bookings/points-screen';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { haptic } from '../telegram/feedback';
import { rememberWay } from '../way/remembered-way';
import { useNameText } from '../way/way-end';
import { errorKey } from './error-text';
import { ExistingRequest } from './existing-request';
import type { RequestAnswer } from './new-request-state';
import { RequestChoice, type RequestChoiceValue } from './request-choice';
import { CommentSheet } from './trip-steps';
import { useShortDay } from './when';

type Props = {
  readonly answer: RequestAnswer;
  readonly recommendation: Recommendation;
  readonly pitak: Pitak | null | undefined;
  readonly onAnswer: (patch: RequestAnswer) => void;
  readonly onEnd: (end: 'pickup' | 'dropoff') => void;
  readonly onBack: () => void;
  readonly onSent: () => void;
};

// «Soʻrov» (G61, docs/118 path 4, mockup 1-request): the screen of a booking, but the passenger
// chooses the people and the price; drivers answer with their time and price (docs/09).
export function RequestPoints({ answer, recommendation, pitak, onAnswer, onEnd, onBack, onSent }: Props) {
  const { t } = useI18n();
  const words = usePassengerWords();
  const shortDay = useShortDay();
  const { market } = useApiClients();
  const nameText = useNameText();
  const [error, setError] = useState<ReturnType<typeof errorKey> | null>(null);
  // A request on this route and day is already open: the button opens it (G37, docs/101 R5).
  const [mine, setMine] = useState(false);
  const [writing, setWriting] = useState(false);
  const [now] = useState(Date.now);
  const { route, date, mode, pickup, dropoff, note = '' } = answer;
  const choice: RequestChoiceValue = {
    seats: answer.seats ?? 1,
    price: answer.price ?? recommendation.price,
    withWoman: answer.withWoman ?? false,
    wholeCar: answer.wholeCar ?? false,
  };
  const exists = error === 'errors.trips.request_exists';
  const closeMine = () => {
    setMine(false);
    setError(null);
  };
  if (!route || !date) return null;
  if (mine) return <ExistingRequest from={route.from.id} to={route.to.id} date={date} onClose={closeMine} />;
  const publish = async () => {
    setError(null);
    if (!mode || (mode === 'door' && !pickup?.point) || !dropoff?.point) return haptic.error();
    try {
      const where = { pickupMode: mode, pickup: mode === 'door' ? (pickup?.point ?? null) : null };
      await market.publishRequest({
        from: route.from.id,
        to: route.to.id,
        date,
        ...choice,
        ...where,
        dropoff: dropoff.point,
        note,
      });
      rememberWay(route.from.id, route.to.id, {
        mode,
        pickup: mode === 'door' ? (pickup ?? null) : null,
        dropoff,
      });
      haptic.success();
      return onSent();
    } catch (caught) {
      haptic.error();
      return setError(errorKey(caught));
    }
  };
  const start =
    mode === 'pitak' ? (pitak?.name ?? null) : pickup ? nameText(pickup.name, pickup.place) : null;
  return (
    <>
      <PointsScreen
        {...words}
        sub={t('market.request.sub', {
          route: t('common.route', { from: route.from.name, to: route.to.name }),
          day: shortDay(date, now),
        })}
        start={start}
        end={dropoff ? nameText(dropoff.name, dropoff.place) : null}
        onEnd={onEnd}
        hint={t('market.request.hint')}
        error={error ? t(error) : null}
        button={t(exists ? 'market.request.openMine' : 'market.request.publish')}
        onSend={exists ? () => setMine(true) : publish}
        onBack={onBack}
        extra={<NoteRow note={note} onOpen={() => setWriting(true)} />}
      >
        <RequestChoice value={choice} recommendation={recommendation} onChange={onAnswer} />
      </PointsScreen>
      {/* «Izoh» is a sheet over the request, as over a booking (G48). */}
      <CommentSheet
        open={writing}
        initial={note}
        hint={t('bookings.note.hint')}
        max={BOOKING_NOTE_MAX}
        onType={(typed) => onAnswer({ note: typed })}
        onClose={() => setWriting(false)}
        onDone={(typed) => {
          onAnswer({ note: typed });
          setWriting(false);
        }}
      />
    </>
  );
}
