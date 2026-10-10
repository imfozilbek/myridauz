import type { Wallet } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useBrand } from '../context/brand-context';

// The money of the driver on top of «Hamyon» (G65, mockup g65/1): the whole sum, how many seats it
// still confirms at the price of the last trip, then the bonus with its end and the main balance.
export function WalletCard({ wallet }: { readonly wallet: Wallet }) {
  const { t, formatMoney, formatNumber, formatDate } = useI18n();
  const { seatsLeft } = wallet;
  const { fewSeats } = useBrand().wallet;
  const low = seatsLeft !== null && seatsLeft < fewSeats;
  const until = wallet.bonusExpiresAt
    ? t('wallet.bonusUntil', { date: formatDate(new Date(wallet.bonusExpiresAt)) })
    : t('wallet.card.unit');
  const count = String(seatsLeft);
  return (
    <div className={low ? 'wallet-card wallet-card-low' : 'wallet-card'}>
      <span className="wallet-card-label">{t('wallet.card.label')}</span>
      <b className="wallet-card-sum">{formatMoney(wallet.bonus + wallet.main)}</b>
      {seatsLeft === null ? null : (
        <b className="wallet-card-seats">
          {low ? t('wallet.card.low', { count }) : t('wallet.card.seats', { count })}
        </b>
      )}
      <span className="wallet-card-tiles">
        <span className="wallet-card-tile">
          <span>{t('wallet.bonus')}</span>
          <b>{formatNumber(wallet.bonus)}</b>
          <span>{until}</span>
        </span>
        <span className="wallet-card-tile">
          <span>{t('wallet.card.main')}</span>
          <b>{formatNumber(wallet.main)}</b>
          <span>{t('wallet.card.unit')}</span>
        </span>
      </span>
    </div>
  );
}
