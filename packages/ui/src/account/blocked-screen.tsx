import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { EmptyState } from '../states/empty-state';
import { useScreenBackground } from '../telegram/screen-background';
import { SupportButton } from './support-button';

// Everything is closed for a blocked person; they learn until when and can write to the team (docs/17).
// No reason here: a block keeps only who blocked (the team or a complaint), no text for the person.
export function BlockedScreen({ until }: { readonly until: number | null }) {
  useScreenView('blocked');
  useScreenBackground('plain');
  const { t, formatDate } = useI18n();
  const description =
    until === null
      ? t('account.blocked.forever')
      : t('account.blocked.until', { date: formatDate(new Date(until)) });
  return (
    <div className="center-screen">
      <EmptyState icon="blocked" title={t('account.blocked.title')} description={description} />
      <SupportButton />
    </div>
  );
}
