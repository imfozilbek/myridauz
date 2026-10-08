import type { Wallet } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import type { ReactNode } from 'react';
import { CellValue } from '../account/cell-value';
import { Cell, List, Section } from '../components';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { useRefundText } from './refund-text';

type Props = {
  readonly wallet: Wallet;
  // The rule of the commission under the balances, for the driver (docs/86 V8).
  readonly rule?: string;
  readonly children?: ReactNode;
};

// The two balances and the journal (docs/12): every sum with its reason, newest first.
export function WalletView({ wallet, rule, children }: Props) {
  const { t, formatMoney, formatDate } = useI18n();
  const refundText = useRefundText();
  // The money that came back is green and bold (mockup g63/5 phone 6).
  const { success } = useBrand().theme.colors;
  const signed = (amount: number) => (amount > 0 ? `+${formatMoney(amount)}` : formatMoney(amount));
  const until = wallet.bonusExpiresAt
    ? t('wallet.bonusUntil', { date: formatDate(new Date(wallet.bonusExpiresAt)) })
    : undefined;
  return (
    <List>
      <Section footer={rule}>
        <Cell subtitle={until} after={<CellValue>{formatMoney(wallet.bonus)}</CellValue>}>
          {t('wallet.bonus')}
        </Cell>
        <Cell after={<CellValue>{formatMoney(wallet.main)}</CellValue>}>{t('wallet.main')}</Cell>
      </Section>
      {children}
      <Section
        header={t('wallet.history')}
        footer={wallet.operations.length === 0 ? t('wallet.empty') : undefined}
      >
        {wallet.operations.map((operation) => {
          const refund = refundText(operation);
          return (
            <Cell
              key={operation.id}
              subtitle={
                refund?.subtitle ??
                [
                  formatDate(new Date(operation.createdAt)),
                  t(`wallet.${operation.balance}`),
                  operation.reason,
                ]
                  .filter(Boolean)
                  .join(', ')
              }
              after={
                refund ? (
                  <Text weight="2" style={{ color: success }}>
                    {refund.sum}
                  </Text>
                ) : (
                  <CellValue>{signed(operation.amount)}</CellValue>
                )
              }
            >
              {refund?.title ?? t(`wallet.kind.${operation.kind}`)}
            </Cell>
          );
        })}
      </Section>
    </List>
  );
}
