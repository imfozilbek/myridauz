import { STATS_PERIODS, type StatsPeriod } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { SegmentedControl } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { BackButton } from '../telegram/back-button';
import { forgetLaunchParam, launchParam } from '../telegram/launch-param';
import { useScreenBackground } from '../telegram/screen-background';
import { StatsSections } from './stats-sections';
import '../market/market.css';
import './stats.css';

// "?stats=day" from a signal of the admin bot opens the dashboard at once (docs/29).
const PARAM = 'stats';
const PERIOD = /^(day|week)$/u;
export const linkedStats = (): StatsPeriod | null => launchParam(PARAM, PERIOD) as StatsPeriod | null;

// "Statistika" of the team (docs/29): the main numbers, three funnels and the top errors.
export function StatsScreen({
  onBack,
  period: first = 'day',
}: {
  readonly onBack: () => void;
  readonly period?: StatsPeriod;
}) {
  useScreenView('stats');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const [period, setPeriod] = useState<StatsPeriod>(first);
  // Once opened from the bot, going back shows the menu and not the dashboard again.
  useEffect(() => forgetLaunchParam(PARAM), []);
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">
        {t('stats.title')}
      </Title>
      <div className="stats-period">
        <SegmentedControl>
          {STATS_PERIODS.map((value) => (
            <SegmentedControl.Item key={value} selected={value === period} onClick={() => setPeriod(value)}>
              {t(`stats.period.${value}`)}
            </SegmentedControl.Item>
          ))}
        </SegmentedControl>
      </div>
      {/* A new period is a new load: the key starts the loader again. */}
      <PeriodStats key={period} period={period} />
    </div>
  );
}

function PeriodStats({ period }: { readonly period: StatsPeriod }) {
  const { stats } = useApiClients();
  const { value, failed, reload } = useLoad(() => stats.get(period));
  if (failed) return <ErrorScreen onRetry={reload} />;
  if (!value) return <ScreenSkeleton />;
  return <StatsSections stats={value} />;
}
