import { STATS_PERIODS, type StatsPeriod } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { ManageChips } from '../manage/manage-chips';
import { ManagePage } from '../manage/manage-page';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { forgetLaunchParam, launchParam } from '../telegram/launch-param';
import { DirectionScreen } from '../waitlist/team/direction-screen';
import { DirectionsScreen } from '../waitlist/team/directions-screen';
import { GoldSections } from '../waitlist/team/gold-sections';
import { WaitingBlock } from '../waitlist/team/waiting-block';
import { StatsSections } from './stats-sections';
import { usePeriodStats } from './use-period-stats';

// "?stats=day" from a signal of the admin bot opens the dashboard at once (docs/29).
const PARAM = 'stats';
const PERIOD = /^(day|week)$/u;
export const linkedStats = (): StatsPeriod | null => launchParam(PARAM, PERIOD) as StatsPeriod | null;

// "Statistika" of the team (docs/29) in the look of «Boshqaruv» (G78 sheet 4): the period in chips,
// the main numbers in tiles, where people came from, the funnels and the top errors in cards.
export function StatsScreen({
  onBack,
  period: first = linkedStats() ?? 'day',
}: {
  readonly onBack: () => void;
  readonly period?: StatsPeriod;
}) {
  useScreenView('stats');
  const { t } = useI18n();
  const [period, setPeriod] = useState<StatsPeriod>(first);
  // Once opened from the bot, a gate mounted again shows the main screen, not the dashboard.
  useEffect(() => {
    forgetLaunchParam(PARAM);
  }, []);
  const { shown, failed, reload } = usePeriodStats(period);
  // «Kutayotganlar» on top opens a direction or all of them (G83, docs/181).
  const [direction, setDirection] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  if (direction) return <DirectionScreen region={direction} onBack={() => setDirection(null)} />;
  if (all) return <DirectionsScreen onDirection={setDirection} onBack={() => setAll(false)} />;
  return (
    <ManagePage title={t('stats.title')} onBack={onBack}>
      <WaitingBlock onDirection={setDirection} onAll={() => setAll(true)} />
      <ManageChips
        label={t('stats.title')}
        chips={STATS_PERIODS.map((id) => ({ id, label: t(`stats.period.${id}`) }))}
        value={period}
        onChange={setPeriod}
      />
      {failed ? (
        <ErrorScreen onRetry={reload} />
      ) : shown ? (
        <StatsSections stats={shown} gold={<GoldSections period={period} />} />
      ) : (
        <ScreenSkeleton />
      )}
    </ManagePage>
  );
}
