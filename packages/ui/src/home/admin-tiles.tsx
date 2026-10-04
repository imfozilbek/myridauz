import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { HomeTile } from '../flow/home-tile';
import type { HomeGo, TileLive } from '../flow/start-action';
import { useLoad } from '../market/use-list';

// The sections the number tiles open (G53).
export const STATS_SECTION = 'statistics';
export const TRIPS_SECTION = 'trips';
export const MANAGEMENT_SECTION = 'management';

// A number of work for the team: how many wait, red while any waits (owner decision 04.10.2026, G53).
// Each tile loads alone: one failed list does not hide the others.
const work = (count: number | undefined, hint: string): TileLive =>
  count === undefined ? {} : { value: count, hint, urgent: count > 0 };

export function useApplicationsLive(): TileLive {
  const { t } = useI18n();
  const { moderation } = useApiClients();
  const { value } = useLoad(() => moderation.queue(), 'home.applications');
  return work(value?.length, t('home.admin.waiting'));
}

export function useComplaintsLive(): TileLive {
  const { t } = useI18n();
  const { feedback } = useApiClients();
  const { value } = useLoad(() => feedback.queue(), 'home.complaints');
  return work(value?.length, t('home.admin.new'));
}

// The numbers of the day after the work, «Boshqaruv» as a row under them.
export function AdminTiles({ go }: { readonly go: HomeGo }) {
  const { t } = useI18n();
  const { stats } = useApiClients();
  const { value } = useLoad(() => stats.get('day'), 'home.stats');
  const numbers = value?.numbers;
  return (
    <>
      <HomeTile
        icon="passengers"
        tone="deep"
        title={t('home.admin.today')}
        hint={t('home.admin.newUsers')}
        {...(numbers ? { value: numbers.newUsers } : {})}
        onClick={() => go(STATS_SECTION)}
      />
      <HomeTile
        icon="trip"
        tone="accent"
        title={t('common.admin.trips')}
        hint={t('home.admin.tripsToday')}
        {...(numbers ? { value: numbers.trips } : {})}
        onClick={() => go(TRIPS_SECTION)}
      />
      <HomeTile
        icon="team"
        tone="deep"
        title={t('common.admin.management')}
        hint={t('common.admin.managementHint')}
        wide
        onClick={() => go(MANAGEMENT_SECTION)}
      />
    </>
  );
}
