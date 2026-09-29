import {
  ApplicationsScreen,
  ComplaintsScreen,
  linkedApplication,
  linkedComplaint,
  ManagementScreen,
  StartFlow,
  type StartAction,
} from '@platform/ui';

// The main screen has at most 3 actions (docs/19).
const ACTIONS: readonly StartAction[] = [
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
    tone: 'accent',
    labelKey: 'common.admin.complaints',
    hintKey: 'common.admin.complaintsHint',
    Screen: ComplaintsScreen,
  },
  // Prices and statistics share one action: at most 3 on the main screen (docs/19).
  {
    id: 'management',
    icon: 'statistics',
    tone: 'deep',
    labelKey: 'common.admin.management',
    hintKey: 'common.admin.managementHint',
    Screen: ManagementScreen,
  },
];

// A link from the admin bot opens the applications or a complaint at once (docs/17, docs/50).
const opened = () =>
  linkedComplaint() ? 'complaints' : linkedApplication() === null ? null : 'applications';

export function StartPage() {
  const open = opened();
  return <StartFlow actions={ACTIONS} {...(open === null ? {} : { opened: open })} />;
}
