import type { PricingVersion } from '@platform/contracts';
import { CellValue } from '../account/cell-value';
import { Button, Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';

type PricingHistoryProps = {
  readonly history: readonly PricingVersion[];
  readonly onRollback: (version: number) => void;
};

// Every change: who, when, what; any old version can come back (docs/23).
export function PricingHistory({ history, onRollback }: PricingHistoryProps) {
  const { t, formatMoney, formatDate, formatTime } = useI18n();
  const [current] = history;
  return (
    <Section header={t('pricing.history')}>
      {history.map((item) => {
        const at = new Date(item.changedAt);
        const who = item.changedBy === null ? t('pricing.start') : `#${item.changedBy}`;
        const values = `${formatMoney(item.variables.ratePerKm)} · ${formatMoney(item.variables.minPrice)} … ${formatMoney(item.variables.maxPrice)}`;
        return (
          <Cell
            key={item.version}
            subtitle={t('pricing.versionBy', { date: `${formatDate(at)} ${formatTime(at)}`, who })}
            description={values}
            after={
              item.version === current?.version ? (
                <CellValue>{t('pricing.current')}</CellValue>
              ) : (
                <Button mode="bezeled" size="s" onClick={() => onRollback(item.version)}>
                  {t('pricing.rollback')}
                </Button>
              )
            }
          >
            {t('pricing.version', { version: String(item.version) })}
          </Cell>
        );
      })}
    </Section>
  );
}
