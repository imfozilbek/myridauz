import { detailKindOf, tashkentDate, type WalletOperation } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { useShortDay } from '../market/when';
import { useOperationName } from './operation-name';
import { useRefundText } from './refund-text';
import { useSigned } from './signed';
import './wallet-rows.css';

const CHEVRON = 10;

type Props = {
  readonly operations: readonly WalletOperation[];
  // A commission or a refund of a booking opens its details (mockup g65/2).
  readonly onOpen: (operation: WalletOperation) => void;
};

// «Tarix» of «Hamyon» (G65, mockup g65/1): «Komissiya · Sardor, 2 joy», «Bugun · bonusdan»,
// «−18 000»; money in is green. A row of a booking opens with «›».
export function WalletRows({ operations, onOpen }: Props) {
  const { t } = useI18n();
  const shortDay = useShortDay();
  const refundText = useRefundText();
  const signed = useSigned();
  const nameOf = useOperationName(operations);
  if (operations.length === 0) return <p className="wallet-empty">{t('wallet.empty')}</p>;
  return (
    <div className="wallet-rows">
      {operations.map((operation) => {
        const day = shortDay(tashkentDate(operation.createdAt), Date.now());
        const kind = detailKindOf(operation);
        const refund = refundText(operation);
        const who = { name: operation.passenger ?? '', seats: String(operation.seats ?? 0) };
        const title =
          refund?.title ??
          (operation.passenger === undefined
            ? nameOf(operation)
            : kind === 'commission'
              ? t('wallet.row.commission', who)
              : t('wallet.row.refund', who));
        const line =
          refund?.subtitle ?? (kind === 'commission' ? t(`wallet.row.${operation.balance}`, { day }) : day);
        const content = (
          <>
            <span className="wallet-row-text">
              <span className="wallet-row-title">{title}</span>
              <span className="wallet-row-line">{line}</span>
            </span>
            <b className={operation.amount > 0 ? 'wallet-row-sum wallet-row-in' : 'wallet-row-sum'}>
              {signed(operation.amount)}
            </b>
          </>
        );
        return kind && operation.bookingId ? (
          <button key={operation.id} type="button" className="wallet-row" onClick={() => onOpen(operation)}>
            {content}
            <span className="wallet-row-chevron">
              <Icon name="next" size={CHEVRON} />
            </span>
          </button>
        ) : (
          <div key={operation.id} className="wallet-row">
            {content}
          </div>
        );
      })}
    </div>
  );
}
