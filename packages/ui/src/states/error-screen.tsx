import { useI18n } from '../context/i18n-context';
import { useOnline } from '../network/online';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { StateScreen } from './state-screen';

type Props = { readonly onRetry: () => void; readonly title?: string; readonly onBack?: () => void };

// An error in simple words with "Try again" (docs/19, principle 8). Never a browser error page (docs/21).
// A screen may name what failed in its own title, e.g. the chat (docs/07).
// "Back" is always there on an inner screen: a bad network never locks the person in (docs/65 B1).
// The red tile in the middle and the main button, as every state (G75, mockup g75/1 A).
export function ErrorScreen({ onRetry, title, onBack }: Props) {
  const { t } = useI18n();
  // Without a network the reason is the network (G43): the banner above says it too.
  const online = useOnline();
  return (
    <>
      {onBack ? <Screen onBack={onBack} /> : null}
      <StateScreen
        icon="error"
        tone="danger"
        title={title ?? t('errors.generic.title')}
        description={t(online ? 'errors.generic.description' : 'errors.network')}
        button={<MainButton text={t('common.retry')} onClick={onRetry} />}
      />
    </>
  );
}
