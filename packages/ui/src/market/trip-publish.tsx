import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { CellValue } from '../account/cell-value';
import { StepLayout } from '../account/step-layout';
import { Cell, List, Section } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { usePending } from '../driver/driver-context';
import { BackButton } from '../telegram/back-button';
import { MainButton, SecondaryButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { errorKey } from './error-text';
import type { TripDraft } from './trip-draft';
import { RouteView } from './route-view';
import { useWhenLabel } from './when';

type TripPublishProps = {
  readonly draft: TripDraft;
  readonly km: number;
  readonly onBack: () => void;
  readonly onClose: () => void;
  // "Qaytish safari": the same trip the other way, one tap after publishing (docs/40, question 43).
  readonly onReturn: () => void;
  // This trip is the way back of the one just published.
  readonly isReturn: boolean;
};

// Everything on one screen before publishing; then a short "done" with the meeting point hint.
export function TripPublish({ draft, km, onBack, onClose, onReturn, isReturn }: TripPublishProps) {
  useScreenView('market.review');
  const { track } = useAnalytics();
  const { market } = useApiClients();
  const { t, formatMoney } = useI18n();
  const when = useWhenLabel();
  const pending = usePending();
  const [error, setError] = useState<ReturnType<typeof errorKey> | null>(null);
  const [published, setPublished] = useState(false);
  const publish = async () => {
    setError(null);
    try {
      const { route, departAt, seats, price, womanOnBoard, comment, pickupMode } = draft;
      await market.publishTrip({
        from: route.from.id,
        to: route.to.id,
        departAt,
        seats,
        price,
        womanOnBoard,
        comment,
        pickupMode,
      });
      track({ name: 'trip_step', screen: 'market.review', step: 'published' });
      if (isReturn) track({ name: 'return_trip_created', screen: 'market.review' });
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
        {isReturn ? null : <SecondaryButton text={t('market.published.return')} onClick={onReturn} />}
      </StepLayout>
    );
  }
  const line = (label: string, value: string) => <Cell after={<CellValue>{value}</CellValue>}>{label}</Cell>;
  return (
    <StepLayout icon="newTrip" title={t('market.review.title')}>
      <BackButton onClick={onBack} />
      <List>
        <Section>
          <div className="route-summary">
            <RouteView from={draft.route.from.id} to={draft.route.to.id} departAt={draft.departAt} km={km} />
          </div>
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
      {pending ? (
        <Text className="step-hint step-note">{t('drivers.status.pending.publish')}</Text>
      ) : (
        <MainButton text={t('market.review.publish')} onClick={publish} />
      )}
    </StepLayout>
  );
}
