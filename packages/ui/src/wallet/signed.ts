import { useI18n } from '../context/i18n-context';

// The math minus of the mockups (g65/1, g65/2): as wide as the plus, never a dash.
const MINUS = '−';

// «−18 000» and «+500 000» of «Hamyon»: the sign always shown. money: with «soʻm», as the journal
// of a wallet for the team says it (G77: one sign for both).
export function useSigned() {
  const { t, formatNumber } = useI18n();
  return (amount: number, money = false) => {
    const sum = `${amount < 0 ? MINUS : '+'}${formatNumber(Math.abs(amount))}`;
    return money ? t('common.money', { amount: sum }) : sum;
  };
}
