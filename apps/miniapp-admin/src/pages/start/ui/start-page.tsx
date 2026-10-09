import {
  linkedCase,
  linkedStats,
  MANAGEMENT_SECTION,
  ManagementScreen,
  NAVBAT_SECTION,
  NavbatScreen,
  PEOPLE_SECTION,
  PeopleScreen,
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
    id: NAVBAT_SECTION,
    icon: 'applications',
    tone: 'brand',
    labelKey: 'team.section.navbat',
    hintKey: 'team.empty',
    Screen: NavbatScreen,
  },
  {
    id: PEOPLE_SECTION,
    icon: 'passengers',
    tone: 'brand',
    labelKey: 'manage.people',
    hintKey: 'manage.peopleHint',
    Screen: PeopleScreen,
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

// A link from the admin bot opens a case in «Navbat» or the dashboard at once (docs/17, docs/29,
// docs/50, G75).
const linked = () => {
  const open = linkedCase();
  if (open) return { opened: NAVBAT_SECTION, launch: { navbat: open } };
  return linkedStats() ? { opened: MANAGEMENT_SECTION } : {};
};

// The main screen of the team: «Diqqat», «Navbat» and «Boshqaruv» of the owner, «Navbat» and the
// own numbers of a moderator (mockup g67/1).
export function StartPage() {
  return (
    <StartFlow actions={NO_ACTIONS} sections={SECTIONS} home={(go) => <TeamHome go={go} />} {...linked()} />
  );
}
