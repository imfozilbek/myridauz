import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { openInTelegram } from '../telegram/feedback';

// «Hisobni toʻldirish» (G75, mockup g75/4 B): the support chat of the brand opens with the message
// ready, the driver only sends it; the team adds the money by hand while payments wait (docs/12).
// Without a passenger short of money (the wallet is only low) the message names no one and no sum.
export function useTopUp() {
  const { t, formatMoney } = useI18n();
  const { bots } = useBrand();
  return (name: string, missing: number) => {
    const message =
      name !== '' && missing > 0
        ? t('wallet.short.message', { name, amount: formatMoney(missing) })
        : t('wallet.topUp.message');
    openInTelegram(`https://t.me/${bots.support}?text=${encodeURIComponent(message)}`);
  };
}
