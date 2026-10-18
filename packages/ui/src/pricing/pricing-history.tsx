import type { PricingVersion } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageRow } from '../manage/manage-page';

type PricingHistoryProps = {
  readonly history: readonly PricingVersion[];
  readonly onRollback: (version: number) => void;
};

// Every change: who and when; any old version can come back (docs/23, G78 sheet 4).
export function PricingHistory({ history, onRollback }: PricingHistoryProps) {
  const { t, formatDate, formatTime } = useI18n();
  const [current] = history;
  return (
    <ManageGroup title={t('pricing.history')}>
      {history.map((item) => {
        const at = new Date(item.changedAt);
        const who = item.changedBy ?? t('pricing.start');
        return (
          <ManageRow
            key={item.version}
            icon="history"
            title={t('pricing.version', { version: String(item.version) })}
            hint={t('pricing.versionBy', { date: `${formatDate(at)} ${formatTime(at)}`, who })}
            value={
              item.version === current?.version ? (
                <span className="manage-quiet">{t('pricing.current')}</span>
              ) : (
                <button type="button" className="navbat-chip" onClick={() => onRollback(item.version)}>
                  {t('pricing.rollback')}
                </button>
              )
            }
          />
        );
      })}
    </ManageGroup>
  );
}
