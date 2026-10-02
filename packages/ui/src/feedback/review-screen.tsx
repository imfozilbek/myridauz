import { DRIVER_TAGS, PASSENGER_TAGS, REVIEW_TEXT_MAX, type ReviewTarget } from '@platform/contracts';
import { Text, Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { FavoriteCell } from '../comfort/favorite-cell';
import { Cell, List, Multiselectable, Section, Textarea } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { errorKey } from '../market/error-text';
import { useLoad } from '../market/use-list';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useDraft } from '../screen/draft';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { DraftNote } from './draft-note';
import { checkReviewDraft, reviewDraftKey, type ReviewDraft } from './feedback-draft';
import { SentScreen } from './sent-screen';
import { StarsRow } from './stars-row';
import '../market/market.css';

type Props = {
  readonly bookingId: string;
  readonly onBack: () => void;
  readonly onComplain: () => void;
  readonly onClose?: (() => void) | undefined;
};

// "Safarni baholang" (docs/24): stars, quick tags, a short text; shown only when both sides rated.
export function ReviewScreen({ bookingId, onBack, onComplain, onClose }: Props) {
  const { feedback } = useApiClients();
  const { value, failed, reload } = useLoad(() => feedback.target(bookingId));
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  const form = { bookingId, onBack, onComplain, onClose };
  return <ReviewForm {...form} target={value} />;
}

type FormProps = Props & { readonly target: ReviewTarget };
type Step = 'edit' | 'sent' | { readonly failed: unknown };

function ReviewForm({ bookingId, target, onBack, onComplain, onClose }: FormProps) {
  useScreenView('reviews.form');
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { feedback } = useApiClients();
  const draft = useDraft(reviewDraftKey(bookingId), checkReviewDraft);
  const [form, setForm] = useState<ReviewDraft>(
    () => draft.restored ?? { stars: 0, tags: [], text: '', ...target.mine },
  );
  const { stars, tags, text } = form;
  const [step, setStep] = useState<Step>('edit');
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
      setStep('sent');
    } catch (error) {
      haptic.error();
      setStep({ failed: error });
    }
  };
  if (step === 'sent')
    return (
      <SentScreen
        icon="star"
        title={t('reviews.sent')}
        description={t('reviews.blind')}
        onBack={onBack}
        onClose={onClose}
      >
        {target.rateeRole === 'driver' ? (
          <List>
            <FavoriteCell driverId={target.rateeId} screen="reviews.form" />
          </List>
        ) : null}
      </SentScreen>
    );
  return (
    <div className="market">
      <Screen onBack={onBack} />
      <Title weight="1" className="market-title">
        {t('reviews.title')}
      </Title>
      <Text className="market-subtitle">{t('reviews.about', { name: target.rateeName })}</Text>
      <DraftNote shown={draft.restored !== null} />
      <List>
        <Section>
          <StarsRow value={stars} onChange={(chosen) => change({ stars: chosen })} />
        </Section>
        <Section header={t('reviews.tagsTitle')}>
          {offered.map((tag) => (
            <Cell
              key={tag}
              Component="label"
              before={<Multiselectable checked={tags.includes(tag)} onChange={() => toggle(tag)} />}
            >
              {t(`reviews.tag.${tag}`)}
            </Cell>
          ))}
        </Section>
        <Section header={t('reviews.textTitle')} footer={t('reviews.blind')}>
          <Textarea
            placeholder={t('reviews.textPlaceholder')}
            value={text}
            maxLength={REVIEW_TEXT_MAX}
            onChange={(event) => change({ text: event.target.value })}
          />
        </Section>
        {typeof step === 'object' ? (
          <Text className="step-hint notify-note">{t(errorKey(step.failed))}</Text>
        ) : null}
        <Section>
          <Cell before={<IconTile name="complaints" tone="accent" />} onClick={onComplain}>
            {t('reviews.complain')}
          </Cell>
        </Section>
      </List>
      {stars > 0 ? <MainButton text={t('reviews.send')} onClick={send} /> : null}
    </div>
  );
}
