import { TEAM_TRIPS_SECTION } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { HomeTile } from '../flow/home-tile';
import type { HomeGo, TileLive } from '../flow/start-action';
import { useLoad } from '../market/use-list';
import { HomeRowCard } from './home-card';

// The sections the number tiles open (G53).
export const STATS_SECTION = 'statistics';
export const TRIPS_SECTION = TEAM_TRIPS_SECTION;
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
  const { colors } = useBrand().theme;
  const { value } = useLoad(() => stats.get('day'), 'home.stats');
  const numbers = value?.numbers;
  return (
    <>
      <HomeTile
        icon="passengers"
        tone="brand"
        title={t('home.admin.today')}
        hint={t('home.admin.newUsers')}
        {...(numbers ? { value: numbers.newUsers } : {})}
        onClick={() => go(STATS_SECTION)}
      />
      <HomeTile
        icon="car"
        tone="brand"
        title={t('common.admin.trips')}
        hint={t('home.admin.activeTrips')}
        {...(numbers ? { value: numbers.activeTrips } : {})}
        onClick={() => go(TRIPS_SECTION)}
      />
      <span className="home-tiles-row">
        <HomeRowCard
          icon="team"
          color={colors.neutralText}
          title={t('common.admin.management')}
          arrow
          onClick={() => go(MANAGEMENT_SECTION)}
        />
      </span>
    </>
  );
}
