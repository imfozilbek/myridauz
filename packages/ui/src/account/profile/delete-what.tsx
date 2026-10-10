import { useApiClients } from '../../context/api-clients';
import { useI18n } from '../../context/i18n-context';
import { Icon } from '../../icons';
import { useLoad } from '../../market/use-list';

const ROWS = ['profile', 'data', 'trips'] as const;
const MARK = 18;
const WALLET = 20;

// What a deletion removes, a red cross on each row (G75, mockup g75/5 A).
export function DeleteWhat() {
  const { t } = useI18n();
  return (
    <div className="delete-card">
      {ROWS.map((row) => (
        <p key={row} className="delete-row">
          <span className="delete-mark">
            <Icon name="close" size={MARK} />
          </span>
          <span>{t(`account.delete.what.${row}`)}</span>
        </p>
      ))}
    </div>
  );
}

// The money of a driver goes with the account and never comes back (docs/58, docs/158 Ж): the sum
// of both balances; the words name the bonus when the bonus is all there is.
export function DeleteWallet() {
  const { t, formatMoney } = useI18n();
  const { wallet } = useApiClients();
  const { value } = useLoad(() => wallet.mine());
  if (!value || value.bonus + value.main <= 0) return null;
  const sum = formatMoney(value.bonus + value.main);
  return (
    <p className="delete-wallet">
      <Icon name="wallet" size={WALLET} />
      <span>{t(value.main > 0 ? 'account.delete.money' : 'account.delete.bonus', { sum })}</span>
    </p>
  );
}
