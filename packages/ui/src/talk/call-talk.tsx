import type { ChatAbout } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { haptic } from '../telegram/feedback';
import { useOneAtATime } from '../telegram/one-at-a-time';
import { RequestLine } from './request-line';
import { TalkAction } from './talk-action';
import { useTalkTexts } from './talk-texts';
import './talk.css';
import './call-talk.css';

type Props = { readonly about: ChatAbout; readonly onChanged: () => unknown };

// A talk about a request in the call (mockups g64/2 phones 2 and 3, g64/4 phone 2): the driver sees
// the request and offers while they speak; the passenger takes the offer that came during the call.
// Before an offer the passenger sees the own request.
export function CallTalk({ about, onChanged }: Props) {
  const { t, formatNumber } = useI18n();
  const texts = useTalkTexts();
  const [since] = useState(Date.now);
  const { bookings } = useApiClients();
  const { failure, fail } = useFailure();
  const { request, offer, role } = about;
  const accept = useOneAtATime(async () => {
    if (!offer) return;
    try {
      await bookings.answerOffer(offer.id, 'accept');
      haptic.success();
      await onChanged();
    } catch (caught) {
      fail(caught);
    }
  });
  if (!request || about.booking) return null;
  const live = offer?.status === 'sent' ? offer : null;
  if (role === 'driver')
    return (
      <>
        <div className="call-talk">
          <span>{t('requests.talk.callRequest', { name: request.passenger.firstName })}</span>
          <b>{`${texts.route(request)} · ${texts.day(request.date)}`}</b>
          <span>{texts.facts(request, true)}</span>
        </div>
        {/* The offer went: «Taklif yuborildi» as on the card of the board (one logic, docs/118 path 7). */}
        {live ? (
          <button type="button" className="call-talk-action" disabled>
            {t('bookings.offer.sent.title')}
          </button>
        ) : (
          <TalkAction request={request} onSent={onChanged} className="call-talk-action" />
        )}
      </>
    );
  if (!live) return <RequestLine request={request} role="passenger" />;
  const sum = formatNumber(live.price * live.seats);
  return (
    <>
      <div className="call-talk">
        <span>
          {t('requests.talk.callOffer', { name: live.driver.firstName })}
          {live.createdAt >= since ? ` · ${t('requests.talk.now')}` : null}
        </span>
        <b className="talk-offer-when">{`${texts.when(live.departAt)} · ${texts.seats(live)}`}</b>
        <span>
          {[
            t('requests.salon.sum', { seats: String(live.seats), price: formatNumber(live.price), sum }),
            ...(live.pitak ? [live.pitak] : []),
          ].join(' · ')}
        </span>
      </div>
      <ActionFailure error={failure} />
      <button type="button" className="call-talk-action" disabled={accept.busy} onClick={accept.run}>
        {t('requests.talk.accept')}
      </button>
    </>
  );
}
