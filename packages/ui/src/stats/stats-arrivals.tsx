import type { Arrivals } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageNote, ManageRow } from '../manage/manage-page';

// The new people of the period: where they came from and on what (G55, docs/116). A channel and an
// ad show their name under the kind, so the owner sees which post or ad brought people.
export function ArrivalsSections({ arrivals }: { readonly arrivals: Arrivals }) {
  const { t, formatNumber } = useI18n();
  return (
    <>
      <ManageGroup title={t('stats.arrivals')}>
        {arrivals.sources.length === 0 ? (
          <ManageRow icon="passengers" title={t('stats.arrivalsEmpty')} />
        ) : null}
        {arrivals.sources.map(({ kind, mark, count }) => (
          <ManageRow
            key={`${kind}:${mark}`}
            icon="passengers"
            title={t(`stats.arrival.${kind}`)}
            {...(mark ? { hint: mark } : {})}
            value={formatNumber(count)}
          />
        ))}
      </ManageGroup>
      <ManageNote>{t('stats.arrivalsHint')}</ManageNote>
      {arrivals.platforms.length > 0 ? (
        <ManageGroup title={t('stats.platforms')}>
          {arrivals.platforms.map(({ platform, count }) => (
            <ManageRow
              key={platform}
              icon="homeScreen"
              title={t(`stats.platform.${platform}`)}
              value={formatNumber(count)}
            />
          ))}
        </ManageGroup>
      ) : null}
    </>
  );
}
