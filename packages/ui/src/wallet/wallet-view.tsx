import type { Wallet } from '@platform/contracts';
import type { ReactNode } from 'react';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageRow } from '../manage/manage-page';
import { useOperationName } from './operation-name';
import { useRefundText } from './refund-text';
import { useSigned } from './signed';

type Props = {
  readonly wallet: Wallet;
  readonly children?: ReactNode;
};

// The two balances and the journal of a driver for the team (docs/12, G78 sheet 4): every sum with
// its reason, newest first; the money that came in is green.
export function WalletView({ wallet, children }: Props) {
  const { t, formatMoney, formatDate } = useI18n();
  const refundText = useRefundText();
  const nameOf = useOperationName(wallet.operations);
  const signed = useSigned();
  const until = wallet.bonusExpiresAt
    ? t('wallet.bonusUntil', { date: formatDate(new Date(wallet.bonusExpiresAt)) })
    : null;
  return (
    <>
      <ManageGroup>
        <ManageRow
          icon="wallet"
          title={t('wallet.bonus')}
          {...(until ? { hint: until } : {})}
          value={formatMoney(wallet.bonus)}
        />
        <ManageRow icon="wallet" title={t('wallet.main')} value={formatMoney(wallet.main)} />
      </ManageGroup>
      {children}
      <ManageGroup title={t('wallet.history')}>
        {wallet.operations.length === 0 ? <ManageRow icon="history" title={t('wallet.empty')} /> : null}
        {wallet.operations.map((operation) => {
          const refund = refundText(operation);
          const hint = [
            formatDate(new Date(operation.createdAt)),
            t(`wallet.${operation.balance}`),
            operation.reason,
          ];
          const sum = refund?.sum ?? signed(operation.amount, true);
          return (
            <ManageRow
              key={operation.id}
              icon="history"
              title={refund?.title ?? nameOf(operation)}
              hint={refund?.subtitle ?? hint.filter(Boolean).join(', ')}
              value={refund || operation.amount > 0 ? <span className="manage-success">{sum}</span> : sum}
            />
          );
        })}
      </ManageGroup>
    </>
  );
}
