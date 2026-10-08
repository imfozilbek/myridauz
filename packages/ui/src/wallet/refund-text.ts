import { NO_SHOW_REASON, tashkentDate, type WalletOperation } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useShortDay } from '../market/when';

// The refund of a no-show the owner confirmed (docs/129, mockup g63/5 phone 6): «Qaytarildi · Akmal
// kelmadi», «Bugun · egasi tasdiqladi», «+9 000». null for every other operation of «Hamyon».
export function useRefundText() {
  const { t, formatNumber } = useI18n();
  const shortDay = useShortDay();
  return (operation: WalletOperation) => {
    const name = operation.reason === NO_SHOW_REASON ? operation.passenger : undefined;
    if (name === undefined) return null;
    const day = shortDay(tashkentDate(operation.createdAt), Date.now());
    return {
      title: t('driverAfter.wallet.refund', { name }),
      subtitle: t('driverAfter.wallet.confirmed', { day }),
      // «+9 000» without «soʻm», as on the mockup g63/5 phone 6.
      sum: `+${formatNumber(operation.amount)}`,
    };
  };
}
