import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { MainButton } from '../telegram/bottom-button';
import { openInTelegram } from '../telegram/feedback';

// "Write to support": the support bot of the brand opens in Telegram (docs/50); the team answers there.
// Its name comes from the brand config (docs/22).
export function SupportButton() {
  const { t } = useI18n();
  const { bots } = useBrand();
  return (
    <MainButton text={t('account.support')} onClick={() => openInTelegram(`https://t.me/${bots.support}`)} />
  );
}
