import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { MainButton } from '../telegram/bottom-button';
import { openInTelegram } from '../telegram/feedback';

// "Write to support": the support bot of the brand opens in Telegram (docs/50); the team answers there.
// Its name comes from the brand config (docs/22).
// start: a ready question the bot sends the team (G75: «Hisobni toʻldirish»).
export function SupportButton({ start }: { readonly start?: string }) {
  const { t } = useI18n();
  const { bots } = useBrand();
  const url = `https://t.me/${bots.support}${start ? `?start=${start}` : ''}`;
  return <MainButton text={t('account.support')} onClick={() => openInTelegram(url)} />;
}
