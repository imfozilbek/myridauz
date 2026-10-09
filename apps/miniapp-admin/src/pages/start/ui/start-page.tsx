import {
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
  TeamHome,
  TeamTripsScreen,
  TRIPS_SECTION,
  type StartAction,
} from '@platform/ui';

const NO_ACTIONS: readonly StartAction[] = [];

// What the main screen of the team and the links of the admin bot open (G53, G75, docs/120).
const SECTIONS: readonly StartAction[] = [
  {
    id: 'applications',
    icon: 'applications',
    tone: 'brand',
    labelKey: 'common.admin.applications',
    hintKey: 'common.admin.applicationsHint',
    Screen: ApplicationsScreen,
  },
  {
    id: 'complaints',
    icon: 'complaints',
    tone: 'brand',
    labelKey: 'common.admin.complaints',
    hintKey: 'common.admin.complaintsHint',
    Screen: ComplaintsScreen,
  },
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

// The main screen of the team: «Diqqat», «Navbat» and «Boshqaruv» of the owner, «Navbat» and the
// own numbers of a moderator (mockup g67/1).
export function StartPage() {
  const open = opened();
  return (
    <StartFlow
      actions={NO_ACTIONS}
      sections={SECTIONS}
      home={(go) => <TeamHome go={go} />}
      {...(open === null ? {} : { opened: open })}
    />
  );
}
