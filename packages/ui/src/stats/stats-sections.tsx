import { MAIN_NUMBERS, type Funnel, type Stats } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageNote, ManageRow } from '../manage/manage-page';
import { NumberTiles } from '../team/number-tiles';
import { ArrivalsSections } from './stats-arrivals';
import { ErrorsSections } from './stats-errors';

// A drop from this share is where people get stuck: it is marked (docs/29).
const HIGH_DROP = 50;

export function StatsSections({ stats }: { readonly stats: Stats }) {
  const { t, formatNumber, formatTime } = useI18n();
  return (
    <>
      <NumberTiles
        kind="stats"
        tiles={MAIN_NUMBERS.map((key) => ({
          value: formatNumber(stats.numbers[key]),
          label: t(`stats.number.${key}`),
        }))}
      />
      <ArrivalsSections arrivals={stats.arrivals} />
      {stats.events === 'on' ? null : (
        <ManageNote>{t(stats.events === 'off' ? 'stats.eventsOff' : 'stats.eventsFailed')}</ManageNote>
      )}
      {stats.funnels.map((funnel, index) => (
        <FunnelSection key={funnel.id} funnel={funnel} hint={index === 0} />
      ))}
      {stats.events === 'on' ? <ErrorsSections errors={stats.errors} /> : null}
      <ManageNote>{t('stats.updated', { time: formatTime(new Date(stats.at)) })}</ManageNote>
    </>
  );
}

function FunnelSection({ funnel, hint }: { readonly funnel: Funnel; readonly hint: boolean }) {
  const { t, formatNumber } = useI18n();
  return (
    <>
      <ManageGroup title={t(`stats.funnel.${funnel.id}`)}>
        {funnel.steps.map((step) => (
          <ManageRow
            key={step.step}
            icon="statistics"
            title={t(`stats.step.${step.step}`)}
            {...(step.drop
              ? { hint: t('stats.left', { drop: step.drop }), alarm: step.drop >= HIGH_DROP }
              : {})}
            value={formatNumber(step.count)}
          />
        ))}
      </ManageGroup>
      {hint ? <ManageNote>{t('stats.funnelHint')}</ManageNote> : null}
    </>
  );
}
