import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { StateScreen } from '../states/state-screen';
import { SupportButton } from './support-button';

// Everything is closed for a blocked person; they learn until when and can write to the team (docs/17).
// No reason here: a block keeps only who blocked (the team or a complaint), no text for the person.
export function BlockedScreen({ until }: { readonly until: number | null }) {
  useScreenView('blocked');
  const { t, formatDate } = useI18n();
  const ask = t('account.blocked.forever');
  return (
    <StateScreen
      button={<SupportButton />}
      icon="blocked"
      tone="danger"
      title={t('account.blocked.title')}
      description={until === null ? ask : t('account.blocked.until', { date: formatDate(new Date(until)) })}
      {...(until === null ? {} : { note: ask })}
    />
  );
}
