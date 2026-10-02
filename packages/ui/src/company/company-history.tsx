import { companyEdition, type CompanyVersion } from '@platform/contracts';
import { legalCompany, legalEdition } from '@platform/i18n';
import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';

// «Oʻzgarishlar tarixi» (docs/96 T27): every save is an edition of the documents, who and when.
export function CompanyHistory({ history }: { readonly history: readonly CompanyVersion[] }) {
  const i18n = useI18n();
  const { t, formatDate, formatTime } = i18n;
  if (history.length === 0) return null;
  return (
    <Section header={t('legal.admin.history')}>
      {history.map((item) => {
        const at = new Date(item.changedAt);
        return (
          <Cell
            key={item.version}
            before={<IconTile name="history" />}
            subtitle={legalCompany(i18n, item.company)}
            description={t('pricing.versionBy', {
              date: `${formatDate(at)} ${formatTime(at)}`,
              who: `#${item.changedBy}`,
            })}
          >
            {legalEdition(i18n, companyEdition(item.version, item.changedAt))}
          </Cell>
        );
      })}
    </Section>
  );
}
