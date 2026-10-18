import {
  ADS_SECTION,
  AdLinksScreen,
  CHANNELS_SECTION,
  linkedCase,
  linkedPerson,
  linkedStats,
  MANAGEMENT_SECTION,
  ManagementScreen,
  NAVBAT_SECTION,
  NavbatScreen,
  PEOPLE_SECTION,
  PeopleScreen,
  ReadChannelsScreen,
  STATS_SECTION,
  StartFlow,
  StatsScreen,
  TeamHome,
  TeamTripsScreen,
  TeamWalletsScreen,
  TRIPS_SECTION,
  WALLETS_SECTION,
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
    id: CHANNELS_SECTION,
    icon: 'channel',
    tone: 'brand',
    labelKey: 'channels.title',
    hintKey: 'channels.title',
    Screen: ReadChannelsScreen,
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
    id: WALLETS_SECTION,
    icon: 'price',
    tone: 'accent',
    labelKey: 'wallet.team.title',
    hintKey: 'wallet.team.title',
    Screen: TeamWalletsScreen,
  },
  {
    id: ADS_SECTION,
    icon: 'adLink',
    tone: 'brand',
    labelKey: 'ads.title',
    hintKey: 'ads.hint',
    Screen: AdLinksScreen,
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

// A link from the admin bot opens a case in «Navbat», «Statistika» or a person in «Odamlar» at once
// (docs/17, docs/29, docs/50, G75, G45): «Назад» from it is the main screen, one tap (G77).
const linked = () => {
  const open = linkedCase();
  if (open) return { opened: NAVBAT_SECTION, launch: { navbat: open } };
  const person = linkedPerson();
  if (person) return { opened: PEOPLE_SECTION, launch: { person } };
  return linkedStats() ? { opened: STATS_SECTION } : {};
};

// The main screen of the team: «Diqqat», «Navbat» and «Boshqaruv» of the owner, «Navbat» and the
// own numbers of a moderator (mockup g67/1).
export function StartPage() {
  return (
    <StartFlow actions={NO_ACTIONS} sections={SECTIONS} home={(go) => <TeamHome go={go} />} {...linked()} />
  );
}
