import { Button } from '../components';
import { useI18n } from '../context/i18n-context';
import { EmptyState } from './empty-state';

// An error in simple words with "Try again" (docs/19, principle 8). Never a browser error page (docs/21).
export function ErrorScreen({ onRetry }: { readonly onRetry: () => void }) {
  const { t } = useI18n();
  const retry = (
    <Button size="m" onClick={onRetry}>
      {t('common.retry')}
    </Button>
  );
  return (
    <EmptyState
      icon="error"
      title={t('errors.generic.title')}
      description={t('errors.generic.description')}
      action={retry}
    />
  );
}
