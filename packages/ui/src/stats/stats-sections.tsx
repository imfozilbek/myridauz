import { MAIN_NUMBERS, type Funnel, type Stats } from '@platform/contracts';
import type { ReactNode } from 'react';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageNote, ManageRow } from '../manage/manage-page';
import { NumberTiles } from '../team/number-tiles';
import { ArrivalsSections } from './stats-arrivals';
import { BotsSection } from './stats-bots';
import { ErrorsSections } from './stats-errors';
import { FeelingsSection } from './stats-feelings';

// A drop from this share is where people get stuck: it is marked (docs/29).
const HIGH_DROP = 50;

// The funnels of the waitlist (G83, docs/183) go first while the list runs, with its «gold» after them.
const isWaitlist = (funnel: Funnel) => funnel.id.startsWith('waitlist');

export function StatsSections({ stats, gold }: { readonly stats: Stats; readonly gold?: ReactNode }) {
  const { t, formatNumber, formatTime } = useI18n();
  const funnels = [
    ...stats.funnels.filter(isWaitlist),
    ...stats.funnels.filter((funnel) => !isWaitlist(funnel)),
  ];
  const listFunnels = stats.funnels.filter(isWaitlist).length;
  return (
    <>
      <NumberTiles
        kind="stats"
        tiles={MAIN_NUMBERS.map((key) => ({
          value: formatNumber(stats.numbers[key]),
          label: t(`stats.number.${key}`),
        }))}
      />
      {stats.events === 'on' ? null : (
        <ManageNote>{t(stats.events === 'off' ? 'stats.eventsOff' : 'stats.eventsFailed')}</ManageNote>
      )}
      {funnels.slice(0, listFunnels).map((funnel, index) => (
        <FunnelSection key={funnel.id} funnel={funnel} hint={index === 0} />
      ))}
      {gold}
      <ArrivalsSections arrivals={stats.arrivals} />
      <FeelingsSection feelings={stats.feelings} />
      {funnels.slice(listFunnels).map((funnel, index) => (
        <FunnelSection key={funnel.id} funnel={funnel} hint={listFunnels === 0 && index === 0} />
      ))}
      {stats.events === 'on' ? <ErrorsSections errors={stats.errors} /> : null}
      {stats.events === 'on' ? <BotsSection bots={stats.bots} queueOps={stats.queueOps} /> : null}
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
