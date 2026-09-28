import { StartFlow, type StartAction } from '@platform/ui';

// The main screen has at most 3 actions (docs/19).
const ACTIONS: readonly StartAction[] = [
  { id: 'applications', icon: 'applications', labelKey: 'common.admin.applications' },
  { id: 'complaints', icon: 'complaints', labelKey: 'common.admin.complaints' },
  { id: 'statistics', icon: 'statistics', labelKey: 'common.admin.statistics' },
];

export function StartPage() {
  return <StartFlow welcomeIcon="team" welcome="common.admin.welcome" actions={ACTIONS} />;
}
