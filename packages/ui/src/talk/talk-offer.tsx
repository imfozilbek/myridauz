import type { Offer, OfferAction } from '@platform/contracts';
import { useAnswerOffer } from '../bookings/use-answer-offer';
import { useI18n } from '../context/i18n-context';
import { UzPlate } from '../plate/uz-plate';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { useOneAtATime } from '../telegram/one-at-a-time';
import { useTalkTexts } from './talk-texts';
import './talk.css';

type Props = {
  readonly offer: Offer;
  readonly role: 'driver' | 'passenger';
  // The name of the other side: the passenger the driver waits for.
  readonly other: string;
  // An answer changed the talk: the booking comes in its place (docs/35).
  readonly onAnswered: () => unknown;
  // An accepted offer opens its seat (G77).
  readonly onSeat?: ((bookingId: string) => void) | undefined;
};

// The offer inside a talk (mockups g64/4 phone 1, g64/5 phone 3): the driver sees what he sent and
// whom he waits for; the passenger answers right here, as in the list of offers (G61).
export function TalkOffer({ offer, role, other, onAnswered, onSeat }: Props) {
  const { t, formatNumber, formatMoney } = useI18n();
  const texts = useTalkTexts();
  const answerOffer = useAnswerOffer('chat');
  const { failure, fail, clear } = useFailure();
  const sum = formatNumber(offer.price * offer.seats);
  const answer = (action: OfferAction) => async () => {
    clear();
    try {
      const answered = await answerOffer(offer, action);
      await onAnswered();
      if (answered.bookingId) onSeat?.(answered.bookingId);
    } catch (caught) {
      fail(caught);
    }
  };
  const accept = useOneAtATime(answer('accept'));
  const decline = useOneAtATime(answer('decline'));
  const busy = accept.busy || decline.busy;
  if (role === 'driver')
    return (
      <div className="talk-offer">
        <span className="talk-offer-kicker">{t('requests.talk.sent')}</span>
        <b className="talk-offer-when">{`${texts.when(offer.departAt)} · ${texts.seats(offer)}`}</b>
        <span className="talk-offer-sub">
          {[
            ...(offer.pitak ? [offer.pitak] : []),
            t('requests.talk.sum', { price: formatNumber(offer.price), count: String(offer.seats), sum }),
          ].join(' · ')}
        </span>
        <b className="talk-offer-wait">{t('requests.talk.waiting', { name: other })}</b>
      </div>
    );
  const { car } = offer.driver;
  return (
    <div className="talk-offer">
      <span className="talk-offer-kicker">
        {t('requests.talk.offered', { name: offer.driver.firstName })}
      </span>
      <b className="talk-offer-when">{`${texts.when(offer.departAt)} · ${texts.seats(offer)}`}</b>
      <span className="talk-offer-sub">
        {`${car.model}, ${t(`drivers.color.${car.color}`)} · `}
        {car.plate ? <UzPlate plate={car.plate} size="s" /> : null}
        {offer.pitak ? ` · ${offer.pitak}` : null}
      </span>
      <span className="talk-offer-sum">
        <span>
          {t('requests.talk.seatsPrice', { count: String(offer.seats), price: formatNumber(offer.price) })}
        </span>
        <b>{formatMoney(offer.price * offer.seats)}</b>
      </span>
      <ActionFailure error={failure} />
      <span className="talk-offer-answer">
        <button type="button" className="talk-decline" disabled={busy} onClick={decline.run}>
          {t('bookings.offer.decline')}
        </button>
        <button type="button" className="talk-accept" disabled={busy} onClick={accept.run}>
          {t('bookings.offer.accept')}
        </button>
      </span>
    </div>
  );
}
