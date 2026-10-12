import { companyEdition, type CompanyVersion } from '@platform/contracts';
import { legalCompany, legalEdition } from '@platform/i18n';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageRow } from '../manage/manage-page';

// «Oʻzgarishlar tarixi» (docs/96 T27): every save is an edition of the documents, who and when.
export function CompanyHistory({ history }: { readonly history: readonly CompanyVersion[] }) {
  const i18n = useI18n();
  const { t, formatDate, formatTime } = i18n;
  if (history.length === 0) return null;
  return (
    <ManageGroup title={t('legal.admin.history')}>
      {history.map((item) => {
        const at = new Date(item.changedAt);
        const when = t('pricing.versionBy', {
          date: `${formatDate(at)} ${formatTime(at)}`,
          who: `#${item.changedBy}`,
        });
        return (
          <ManageRow
            key={item.version}
            icon="history"
            title={legalEdition(i18n, companyEdition(item.version, item.changedAt))}
            hint={t('home.meta', { when: legalCompany(i18n, item.company), more: when })}
          />
        );
      })}
    </ManageGroup>
  );
}
