import { useI18n } from '../context/i18n-context';
import { MainButton } from '../telegram/bottom-button';
import { useOpenSupport } from '../telegram/support-link';

// "Write to support": the support bot of the brand opens in Telegram (docs/50); the team answers there.
export function SupportButton() {
  const { t } = useI18n();
  const support = useOpenSupport();
  return <MainButton text={t('account.support')} onClick={() => support()} />;
}
