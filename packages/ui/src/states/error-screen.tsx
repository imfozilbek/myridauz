import { Button } from '../components';
import { useI18n } from '../context/i18n-context';
import { EmptyState } from './empty-state';

type Props = { readonly onRetry: () => void; readonly title?: string };

// An error in simple words with "Try again" (docs/19, principle 8). Never a browser error page (docs/21).
// A screen may name what failed in its own title, e.g. the chat (docs/07).
export function ErrorScreen({ onRetry, title }: Props) {
  const { t } = useI18n();
  const retry = (
    <Button size="m" onClick={onRetry}>
      {t('common.retry')}
    </Button>
  );
  return (
    <EmptyState
      icon="error"
      title={title ?? t('errors.generic.title')}
      description={t('errors.generic.description')}
      action={retry}
    />
  );
}
