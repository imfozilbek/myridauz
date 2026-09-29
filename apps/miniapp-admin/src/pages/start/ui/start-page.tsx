import {
  ApplicationsScreen,
  linkedApplication,
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

export function StartPage() {
  // A link from the admin bot opens the applications at once (docs/50).
  return (
    <StartFlow actions={ACTIONS} {...(linkedApplication() === null ? {} : { opened: 'applications' })} />
  );
}
