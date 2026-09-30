import { DRIVER_TAGS, PASSENGER_TAGS, REVIEW_TEXT_MAX, type ReviewTarget } from '@platform/contracts';
import { Text, Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { FavoriteCell } from '../comfort/favorite-cell';
import { Cell, Input, List, Section } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { IconTile } from '../icon-tile';
import { errorKey } from '../market/error-text';
import { useLoad } from '../market/use-list';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { BackButton } from '../telegram/back-button';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { StarsRow } from './stars-row';
import '../market/market.css';

type Props = { readonly bookingId: string; readonly onBack: () => void; readonly onComplain: () => void };

// "Safarni baholang" (docs/24): stars, quick tags, a short text; shown only when both sides rated.
export function ReviewScreen({ bookingId, onBack, onComplain }: Props) {
  const { feedback } = useApiClients();
  const { value, failed, reload } = useLoad(() => feedback.target(bookingId));
  if (failed) return <ErrorScreen onRetry={reload} />;
  if (!value) return <ScreenSkeleton />;
  return <ReviewForm bookingId={bookingId} target={value} onBack={onBack} onComplain={onComplain} />;
}

type FormProps = Props & { readonly target: ReviewTarget };
type Step = 'edit' | 'busy' | 'sent' | { readonly failed: unknown };

function ReviewForm({ bookingId, target, onBack, onComplain }: FormProps) {
  useScreenView('reviews.form');
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { feedback } = useApiClients();
  const [stars, setStars] = useState(target.mine?.stars ?? 0);
  const [tags, setTags] = useState<readonly string[]>(target.mine?.tags ?? []);
  const [text, setText] = useState(target.mine?.text ?? '');
  const [step, setStep] = useState<Step>('edit');
  const offered = target.rateeRole === 'driver' ? DRIVER_TAGS : PASSENGER_TAGS;
  const toggle = (tag: string) =>
    setTags(tags.includes(tag) ? tags.filter((known) => known !== tag) : [...tags, tag]);
  const send = async () => {
    setStep('busy');
    try {
      await feedback.review({ bookingId, stars, tags: [...tags], text: text.trim() });
      track({ name: 'review_sent', screen: 'reviews.form' });
      haptic.success();
      setStep('sent');
    } catch (error) {
      haptic.error();
      setStep({ failed: error });
    }
  };
  if (step === 'sent')
    return (
      <div className="market">
        <BackButton onClick={onBack} />
        <EmptyState icon="star" title={t('reviews.sent')} description={t('reviews.blind')} />
        {target.rateeRole === 'driver' ? (
          <List>
            <FavoriteCell driverId={target.rateeId} screen="reviews.form" />
          </List>
        ) : null}
      </div>
    );
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">
        {t('reviews.title')}
      </Title>
      <Text className="market-subtitle">{t('reviews.about', { name: target.rateeName })}</Text>
      <List>
        <Section>
          <StarsRow value={stars} onChange={setStars} />
        </Section>
        <Section header={t('reviews.tagsTitle')}>
          {offered.map((tag) => (
            <Cell
              key={tag}
              onClick={() => toggle(tag)}
              after={tags.includes(tag) ? <Icon name="selected" /> : null}
            >
              {t(`reviews.tag.${tag}`)}
            </Cell>
          ))}
        </Section>
        <Section header={t('reviews.textTitle')} footer={t('reviews.blind')}>
          <Input
            placeholder={t('reviews.textPlaceholder')}
            value={text}
            maxLength={REVIEW_TEXT_MAX}
            onChange={(event) => setText(event.target.value)}
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
      {stars > 0 && step !== 'busy' ? <MainButton text={t('reviews.send')} onClick={send} /> : null}
    </div>
  );
}
