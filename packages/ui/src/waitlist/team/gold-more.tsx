import type { WaitlistStats } from '@platform/contracts';
import { Fragment } from 'react';
import { useI18n } from '../../context/i18n-context';
import { ManageGroup, ManageRow } from '../../manage/manage-page';
import { shareOf } from './share';

// The groups of three hours from the morning; the night before 06:00 shows only when people wrote.
const MORNING = 6;
const SLOT_HOURS = 3;
const DAY_HOURS = 24;
const hour = (value: number) => `${String(value).padStart(2, '0')}:00`;

type Props = {
  readonly stats: WaitlistStats;
  readonly reach: (row: { opened: number; listed: number }) => string;
};

// «Qachon yozilishdi», «Qurilmalar», «Qanchalik tez-tez» (docs/183, mockup 6-team-stats).
export function GoldMore({ stats, reach }: Props) {
  const { t, formatNumber } = useI18n();
  const total = stats.hours.reduce((sum, row) => sum + row.count, 0);
  const night = stats.hours.filter((row) => row.from < MORNING).reduce((sum, row) => sum + row.count, 0);
  const slots = [
    ...(night > 0 ? [{ from: 0, to: MORNING, count: night }] : []),
    ...Array.from({ length: (DAY_HOURS - MORNING) / SLOT_HOURS }, (_, index) => {
      const from = MORNING + index * SLOT_HOURS;
      return { from, to: from + SLOT_HOURS, count: stats.hours.find((row) => row.from === from)?.count ?? 0 };
    }),
  ];
  const passengers = stats.cadences.reduce((sum, row) => sum + row.count, 0);
  return (
    <>
      {total > 0 ? (
        <ManageGroup title={t('waitlistTeam.hours')}>
          {slots.map(({ from, to, count }) => (
            <div key={from} className="wl-bar">
              <span className="wl-bar-top">
                <span>{t('waitlistTeam.hour', { from: hour(from), to: hour(to) })}</span>
                <b>{shareOf(count, total)} %</b>
              </span>
              <span className="wl-meter">
                <i style={{ width: `${shareOf(count, total)}%` }} />
              </span>
            </div>
          ))}
        </ManageGroup>
      ) : null}
      <ManageGroup title={t('waitlistTeam.devices')}>
        {stats.devices.map((row) => (
          <ManageRow
            key={row.platform}
            icon="homeScreen"
            title={t(`waitlistTeam.device.${row.platform}`)}
            hint={reach(row)}
            value={formatNumber(row.listed)}
          />
        ))}
      </ManageGroup>
      <ManageGroup title={t('waitlistTeam.cadences')}>
        {passengers > 0 ? (
          <p className="wl-team-line">
            {t('waitlistTeam.cadenceWho')}{' '}
            {stats.cadences.map(({ cadence, count }, index) => (
              <Fragment key={cadence}>
                {index > 0 ? ' · ' : null}
                {t(`waitlist.cadence.${cadence}`)} <b>{shareOf(count, passengers)} %</b>
              </Fragment>
            ))}
          </p>
        ) : null}
        <ManageRow title={t('waitlistTeam.bothRoles')} value={formatNumber(stats.bothRoles)} />
      </ManageGroup>
    </>
  );
}
