import type { Rost, RostPeriod } from '@platform/contracts';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ManageChips } from '../manage/manage-chips';
import { ManageGroup, ManageNote, ManagePage, ManageRow } from '../manage/manage-page';
import { PlacesGate, usePlaces } from '../market/places-gate';
import { useLoad } from '../market/use-list';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';

const PERIODS: readonly RostPeriod[] = ['week', 'month'];
const PERCENT = 100;

// «Rost» of the owner (G69, docs/123): what each loop of growth brought, came, registered and rode,
// and each direction, how many searches found a trip (the capture goes on after 70 %).
export function RostScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('growth.rost');
  const { t } = useI18n();
  const [period, setPeriod] = useState<RostPeriod>('week');
  return (
    <ManagePage title={t('growth.rost.title')} hint={t('growth.rost.hint')} onBack={onBack}>
      <ManageChips
        label={t('growth.rost.title')}
        chips={PERIODS.map((id) => ({ id, label: t(`growth.rost.period.${id}`) }))}
        value={period}
        onChange={setPeriod}
      />
      <PlacesGate>
        <RostOf key={period} period={period} />
      </PlacesGate>
    </ManagePage>
  );
}

// One period, loaded once when it is chosen.
function RostOf({ period }: { readonly period: RostPeriod }) {
  const { stats } = useApiClients();
  const { value, failed, reload } = useLoad(() => stats.rost(period), `growth.rost:${period}`);
  if (failed) return <ErrorScreen onRetry={reload} />;
  return value ? <RostSections rost={value} /> : <ScreenSkeleton />;
}

function RostSections({ rost }: { readonly rost: Rost }) {
  const { t, formatNumber } = useI18n();
  const directory = usePlaces();
  const name = (id: string) => directory.find(id)?.name ?? id;
  return (
    <>
      <ManageGroup title={t('growth.rost.loops')}>
        {rost.loops.map((row) => (
          <ManageRow
            key={row.loop}
            title={t(`growth.rost.loop.${row.loop}`)}
            hint={t('growth.rost.line', {
              came: formatNumber(row.came),
              registered: formatNumber(row.registered),
              rode: formatNumber(row.rode),
            })}
            arrow={false}
          />
        ))}
      </ManageGroup>
      {rost.events === 'on' ? null : <ManageNote>{t(`growth.rost.${rost.events}`)}</ManageNote>}
      <ManageGroup title={t('growth.rost.directions')}>
        {rost.directions.length === 0 ? (
          <ManageRow title={t('growth.rost.noSearches')} arrow={false} />
        ) : null}
        {rost.directions.map(({ route, searches, found }) => {
          const [from = '', to = ''] = route.split('-');
          return (
            <ManageRow
              key={route}
              title={t('common.route', { from: name(from), to: name(to) })}
              hint={t('growth.rost.found', { found: formatNumber(found), searches: formatNumber(searches) })}
              value={`${Math.round((found / searches) * PERCENT)}%`}
              arrow={false}
            />
          );
        })}
      </ManageGroup>
    </>
  );
}
