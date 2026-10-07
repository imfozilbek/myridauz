import {
  DRIVER_TAGS,
  PASSENGER_TAGS,
  REVIEW_TEXT_MAX,
  type Booking,
  type ReviewTarget,
} from '@platform/contracts';
import { useState } from 'react';
import { Textarea } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { errorKey } from '../market/error-text';
import { useDraft } from '../screen/draft';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import { TripCard } from '../trip/trip-card';
import { DraftNote } from './draft-note';
import { FavoriteSwitch } from './favorite-switch';
import { checkReviewDraft, reviewDraftKey, type ReviewDraft } from './feedback-draft';
import { ReviewHead } from './review-head';
import { StarsRow } from './stars-row';
import './review.css';

type Props = {
  readonly bookingId: string;
  readonly target: ReviewTarget;
  readonly booking: Booking | null;
  readonly onBack: () => void;
  readonly onComplain: () => void;
  // Sent: the review closes at once, no screen after it (owner decision 06.10.2026).
  readonly onSent: () => void;
};

// «Safarni baholang» (docs/24, docs/118 path 3, mockup g60/5): the driver and the one trip card,
// stars, tags as chips, a comment behind «+ Izoh yozish», «Sevimli haydovchi» as a switch.
export function ReviewForm({ bookingId, target, booking, onBack, onComplain, onSent }: Props) {
  useScreenView('reviews.form');
  useScreenBackground('tinted');
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { feedback } = useApiClients();
  const draft = useDraft(reviewDraftKey(bookingId), checkReviewDraft);
  const [form, setForm] = useState<ReviewDraft>(
    () => draft.restored ?? { stars: 0, tags: [], text: '', ...target.mine },
  );
  const { stars, tags, text } = form;
  const [writing, setWriting] = useState(text.length > 0);
  const [failed, setFailed] = useState<unknown>(null);
  const offered = target.rateeRole === 'driver' ? DRIVER_TAGS : PASSENGER_TAGS;
  const change = (patch: Partial<ReviewDraft>) => {
    const next = { ...form, ...patch };
    setForm(next);
    draft.save(next);
  };
  const toggle = (tag: string) => {
    haptic.select();
    change({ tags: tags.includes(tag) ? tags.filter((known) => known !== tag) : [...tags, tag] });
  };
  // The promise keeps the loader on the button while sending (docs/94 C5).
  const send = async () => {
    try {
      await feedback.review({ bookingId, stars, tags: [...tags], text: text.trim() });
      track({ name: 'review_sent', screen: 'reviews.form' });
      haptic.success();
      draft.clear();
      onSent();
    } catch (error) {
      haptic.error();
      setFailed(error);
    }
  };
  return (
    <div className="review">
      <Screen onBack={onBack} />
      <DraftNote shown={draft.restored !== null} />
      <div className="review-card">
        <ReviewHead target={target} booking={booking} />
        {booking ? <TripCard booking={booking} sum={false} /> : null}
      </div>
      <p className="review-label">{t('reviews.howWas')}</p>
      <div className="review-stars">
        <StarsRow value={stars} onChange={(chosen) => change({ stars: chosen })} />
      </div>
      <p className="review-label">{t('reviews.tagsTitle')}</p>
      <div className="review-tags">
        {offered.map((tag) => (
          <button
            key={tag}
            type="button"
            className="review-tag"
            aria-pressed={tags.includes(tag)}
            onClick={() => toggle(tag)}
          >
            {t(`reviews.tag.${tag}`)}
          </button>
        ))}
      </div>
      {writing ? (
        <Textarea
          placeholder={t('reviews.textPlaceholder')}
          value={text}
          maxLength={REVIEW_TEXT_MAX}
          onChange={(event) => change({ text: event.target.value })}
        />
      ) : (
        <button type="button" className="review-add" onClick={() => setWriting(true)}>
          {t('reviews.addText')}
        </button>
      )}
      {target.rateeRole === 'driver' ? <FavoriteSwitch driverId={target.rateeId} /> : null}
      {failed ? <p className="review-note review-failed">{t(errorKey(failed))}</p> : null}
      <p className="review-note">{t('reviews.blind')}</p>
      <button type="button" className="review-complain" onClick={onComplain}>
        {t('complaints.title')}
      </button>
      {stars > 0 ? <MainButton text={t('reviews.send')} onClick={send} /> : null}
    </div>
  );
}
