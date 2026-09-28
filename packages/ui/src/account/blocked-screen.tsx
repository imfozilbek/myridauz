import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { EmptyState } from '../states/empty-state';
import { useScreenBackground } from '../telegram/screen-background';

// Everything is closed for a blocked person; they only learn why and until when (docs/17).
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
    </div>
  );
}
