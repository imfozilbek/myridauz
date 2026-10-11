import { useI18n } from '../context/i18n-context';
import { useOpenSupport } from '../telegram/support-link';

// «Hisobni toʻldirish» (G75, mockup g75/4 B): the support chat of the brand opens with the message
// ready, the driver only sends it; the team adds the money by hand while payments wait (docs/12).
// Without a passenger short of money (the wallet is only low) the message names no one and no sum.
export function useTopUp() {
  const { t, formatMoney } = useI18n();
  const support = useOpenSupport();
  return (name: string, missing: number) => {
    const message =
      name !== '' && missing > 0
        ? t('wallet.short.message', { name, amount: formatMoney(missing) })
        : t('wallet.topUp.message');
    support(message);
  };
}
