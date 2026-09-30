import { Button } from '../components';
import { useI18n } from '../context/i18n-context';
import { EmptyState } from '../states/empty-state';
import { BackButton } from '../telegram/back-button';

// The map did not load (G22): say so and try again; the list of districts stays as the other way.
export function MapFailed({
  onBack,
  onRetry,
}: {
  readonly onBack: () => void;
  readonly onRetry: () => void;
}) {
  const { t } = useI18n();
  return (
    <>
      <BackButton onClick={onBack} />
      <EmptyState
        icon="error"
        title={t('bookings.map.failed')}
        description={t('bookings.map.failedHint')}
        action={
          <Button size="m" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        }
      />
    </>
  );
}
