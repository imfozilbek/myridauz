import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { EmptyState } from '../states/empty-state';
import { BackButton } from '../telegram/back-button';
import { useScreenBackground } from '../telegram/screen-background';
import type { StartAction } from './start-action';

// A section that arrives in a later goal: says so honestly and offers the way back.
export function SoonScreen({
  action,
  onBack,
}: {
  readonly action: StartAction;
  readonly onBack: () => void;
}) {
  useScreenView(action.id);
  useScreenBackground('plain');
  const { t } = useI18n();
  return (
    <>
      <BackButton onClick={onBack} />
      <EmptyState icon={action.icon} title={t(action.labelKey)} description={t('common.soon')} />
    </>
  );
}
