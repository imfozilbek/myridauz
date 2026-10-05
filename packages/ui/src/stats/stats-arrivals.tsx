import type { Arrivals } from '@platform/contracts';
import { CellValue } from '../account/cell-value';
import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';

// The new people of the period: where they came from and on what (G55, docs/116). A channel and an
// ad show their name under the kind, so the owner sees which post or ad brought people.
export function ArrivalsSections({ arrivals }: { readonly arrivals: Arrivals }) {
  const { t, formatNumber } = useI18n();
  const count = (value: number) => <CellValue>{formatNumber(value)}</CellValue>;
  return (
    <>
      <Section header={t('stats.arrivals')} footer={t('stats.arrivalsHint')}>
        {arrivals.sources.length === 0 ? <Cell>{t('stats.arrivalsEmpty')}</Cell> : null}
        {arrivals.sources.map(({ kind, mark, count: people }) => (
          <Cell key={`${kind}:${mark}`} {...(mark ? { subtitle: mark } : {})} after={count(people)}>
            {t(`stats.arrival.${kind}`)}
          </Cell>
        ))}
      </Section>
      {arrivals.platforms.length > 0 ? (
        <Section header={t('stats.platforms')}>
          {arrivals.platforms.map(({ platform, count: people }) => (
            <Cell key={platform} after={count(people)}>
              {t(`stats.platform.${platform}`)}
            </Cell>
          ))}
        </Section>
      ) : null}
    </>
  );
}
