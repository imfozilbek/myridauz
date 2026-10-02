import { Button } from '../components';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { EmptyState } from './empty-state';

type Props = { readonly onRetry: () => void; readonly title?: string; readonly onBack?: () => void };

// An error in simple words with "Try again" (docs/19, principle 8). Never a browser error page (docs/21).
// A screen may name what failed in its own title, e.g. the chat (docs/07).
// "Back" is always there on an inner screen: a bad network never locks the person in (docs/65 B1).
export function ErrorScreen({ onRetry, title, onBack }: Props) {
  const { t } = useI18n();
  const retry = (
    <Button size="m" onClick={onRetry}>
      {t('common.retry')}
    </Button>
  );
  return (
    <>
      {onBack ? <Screen onBack={onBack} /> : null}
      <EmptyState
        icon="error"
        title={title ?? t('errors.generic.title')}
        description={t('errors.generic.description')}
        action={retry}
      />
    </>
  );
}
