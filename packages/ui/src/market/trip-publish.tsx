import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { CellValue } from '../account/cell-value';
import { StepLayout } from '../account/step-layout';
import { Cell, List, Section } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { BackButton } from '../telegram/back-button';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { errorKey } from './error-text';
import type { TripDraft } from './new-trip-flow';
import { useWhenLabel } from './when';

type TripPublishProps = {
  readonly draft: TripDraft;
  readonly onBack: () => void;
  readonly onClose: () => void;
};

// Everything on one screen before publishing; then a short "done" with the meeting point hint.
export function TripPublish({ draft, onBack, onClose }: TripPublishProps) {
  useScreenView('market.review');
  const { track } = useAnalytics();
  const { market } = useApiClients();
  const { t, formatMoney } = useI18n();
  const when = useWhenLabel();
  const [error, setError] = useState<ReturnType<typeof errorKey> | null>(null);
  const [published, setPublished] = useState(false);
  const publish = async () => {
    setError(null);
    try {
      const { route, departAt, seats, price, womanOnBoard, comment } = draft;
      await market.publishTrip({
        from: route.from.id,
        to: route.to.id,
        departAt,
        seats,
        price,
        womanOnBoard,
        comment,
      });
      track({ name: 'trip_step', screen: 'market.review', step: 'published' });
      haptic.success();
      setPublished(true);
    } catch (caught) {
      haptic.error();
      setError(errorKey(caught));
    }
  };
  if (published) {
    return (
      <StepLayout icon="selected" title={t('market.published.title')} hint={t('market.published.hint')}>
        <MainButton text={t('market.done')} onClick={onClose} />
      </StepLayout>
    );
  }
  const line = (label: string, value: string) => <Cell after={<CellValue>{value}</CellValue>}>{label}</Cell>;
  return (
    <StepLayout icon="newTrip" title={t('market.review.title')}>
      <BackButton onClick={onBack} />
      <List>
        <Section>
          <Cell multiline description={`${draft.route.from.name} → ${draft.route.to.name}`}>
            {t('market.review.route')}
          </Cell>
          {line(t('market.review.when'), when(draft.departAt))}
          {line(t('market.review.seats'), String(draft.seats))}
          {line(t('market.review.price'), formatMoney(draft.price))}
          {draft.womanOnBoard ? <Cell>{t('market.search.woman')}</Cell> : null}
          {draft.comment ? (
            <Cell multiline description={draft.comment}>
              {t('market.review.comment')}
            </Cell>
          ) : null}
        </Section>
      </List>
      {error ? <Text className="step-error">{t(error)}</Text> : null}
      <MainButton text={t('market.review.publish')} onClick={() => void publish()} />
    </StepLayout>
  );
}
