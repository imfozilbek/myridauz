import { useI18n } from '../context/i18n-context';

// The math minus of the mockups (g65/1, g65/2): as wide as the plus, never a dash.
const MINUS = '−';

// «−18 000» and «+500 000» of «Hamyon»: the sign always shown.
export function useSigned() {
  const { formatNumber } = useI18n();
  return (amount: number) => `${amount < 0 ? MINUS : '+'}${formatNumber(Math.abs(amount))}`;
}
