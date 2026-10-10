import type { WalletOperation } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';

// The bonuses of the promotion by their order: the first, the second, the third (docs/12).
function bonusOrder(operations: readonly WalletOperation[]): ReadonlyMap<string, number> {
  const grants = operations
    .filter((operation) => operation.kind === 'bonus_grant')
    .sort((a, b) => a.createdAt - b.createdAt);
  return new Map(grants.map((operation, index) => [operation.id, index + 1]));
}

// The name of an operation in «Tarix» (G65): the second and the third bonus say their month, the
// first keeps «Boshlash bonusi» of the mockup g65/1 (G75, docs/158 Г).
export function useOperationName(operations: readonly WalletOperation[]) {
  const { t } = useI18n();
  const order = bonusOrder(operations);
  return (operation: WalletOperation) => {
    const month = order.get(operation.id) ?? 1;
    return month > 1
      ? t('wallet.kind.bonusMonth', { month: String(month) })
      : t(`wallet.kind.${operation.kind}`);
  };
}
