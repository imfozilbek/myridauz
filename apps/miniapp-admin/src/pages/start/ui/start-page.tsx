import {
  AdminTiles,
  ApplicationsScreen,
  ComplaintsScreen,
  linkedApplication,
  linkedComplaint,
  linkedStats,
  MANAGEMENT_SECTION,
  ManagementScreen,
  STATS_SECTION,
  StartFlow,
  StatsScreen,
  TeamTripsScreen,
  TRIPS_SECTION,
  useApplicationsLive,
  useComplaintsLive,
  type StartAction,
} from '@platform/ui';

// The work of the team as number tiles: how many applications and complaints wait (G53).
const ACTIONS: readonly StartAction[] = [
  {
    id: 'applications',
    icon: 'applications',
    tone: 'deep',
    labelKey: 'common.admin.applications',
    hintKey: 'common.admin.applicationsHint',
    useLive: useApplicationsLive,
    Screen: ApplicationsScreen,
  },
  {
    id: 'complaints',
    icon: 'complaints',
    tone: 'deep',
    labelKey: 'common.admin.complaints',
    hintKey: 'common.admin.complaintsHint',
    useLive: useComplaintsLive,
    Screen: ComplaintsScreen,
  },
];

// The numbers of the day open their screens; «Boshqaruv» keeps prices, wallets and the rest (G53).
const SECTIONS: readonly StartAction[] = [
  {
    id: STATS_SECTION,
    icon: 'statistics',
    tone: 'deep',
    labelKey: 'common.admin.statistics',
    hintKey: 'common.admin.statisticsHint',
    Screen: StatsScreen,
  },
  {
    id: TRIPS_SECTION,
    icon: 'trip',
    tone: 'accent',
    labelKey: 'common.admin.trips',
    hintKey: 'common.admin.tripsHint',
    Screen: TeamTripsScreen,
  },
  {
    id: MANAGEMENT_SECTION,
    icon: 'statistics',
    tone: 'deep',
    labelKey: 'common.admin.management',
    hintKey: 'common.admin.managementHint',
    Screen: ManagementScreen,
  },
];

// A link from the admin bot opens the applications, a complaint or the dashboard at once
// (docs/17, docs/29, docs/50).
const opened = () => {
  if (linkedComplaint()) return 'complaints';
  if (linkedStats()) return MANAGEMENT_SECTION;
  return linkedApplication() === null ? null : 'applications';
};

export function StartPage() {
  const open = opened();
  return (
    <StartFlow
      actions={ACTIONS}
      sections={SECTIONS}
      tiles={(go) => <AdminTiles go={go} />}
      {...(open === null ? {} : { opened: open })}
    />
  );
}
