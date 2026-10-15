import type { StatsPeriod, WaitlistSource, WaitlistStats } from '@platform/contracts';
import { useApiClients } from '../../context/api-clients';
import { useI18n } from '../../context/i18n-context';
import type { IconName } from '../../icons';
import { ManageGroup, ManageRow } from '../../manage/manage-page';
import { useLoad } from '../../market/use-list';
import { GoldMore } from './gold-more';
import { shareOf } from './share';
import { useRouteName } from './waiting-block';
import './team.css';

const SOURCE_ICONS: Readonly<Record<WaitlistSource, IconName>> = {
  channel: 'channel',
  friend: 'invite',
  ad: 'adLink',
  site: 'homeScreen',
  direct: 'botFace',
  other: 'share',
};
const AVERAGE_DIGITS = 1;
// «87:1»: the passengers for one driver; «87:0» where there is no driver yet.
const perDriver = ({ passengers, drivers }: { passengers: number; drivers: number }) =>
  drivers === 0 ? `${passengers}:0` : `${Math.round(passengers / drivers)}:1`;

// The «gold» of «Statistika» (docs/183, mockup 6-team-stats): what people did after the list, where
// they came from, where drivers are missing; then the hours, the platforms, how often.
export function GoldSections({ period }: { readonly period: StatsPeriod }) {
  const { t, formatNumber } = useI18n();
  const { waitlist } = useApiClients();
  const route = useRouteName();
  const { value } = useLoad(() => waitlist.stats(period));
  if (!value) return null;
  const { after } = value;
  const average = after.listed === 0 ? 0 : after.byFriends / after.listed;
  const reach = (row: { opened: number; listed: number }) =>
    t('waitlistTeam.reach', { n: formatNumber(row.opened), share: shareOf(row.listed, row.opened) });
  return (
    <>
      <ManageGroup title={t('waitlistTeam.after')}>
        <ManageRow
          icon="channel"
          title={t('waitlistTeam.joined')}
          hint={t('waitlistTeam.joinedHint')}
          value={`${shareOf(after.joined, after.listed)} %`}
        />
        <ManageRow
          icon="share"
          title={t('waitlistTeam.invited')}
          hint={t('waitlistTeam.invitedHint')}
          value={`${shareOf(after.invited, after.listed)} %`}
        />
        <ManageRow
          icon="invite"
          title={t('waitlistTeam.byFriends')}
          hint={t('waitlistTeam.byFriendsHint', { n: average.toFixed(AVERAGE_DIGITS).replace('.', ',') })}
          value={formatNumber(after.byFriends)}
        />
      </ManageGroup>
      <ManageGroup title={t('waitlistTeam.sources')}>
        {value.sources.map((row: WaitlistStats['sources'][number]) => (
          <ManageRow
            key={row.source}
            icon={SOURCE_ICONS[row.source]}
            title={t(`waitlistTeam.source.${row.source}`)}
            hint={reach(row)}
            value={formatNumber(row.listed)}
          />
        ))}
      </ManageGroup>
      {value.shortage.length > 0 ? (
        <ManageGroup title={t('waitlistTeam.shortage')}>
          {value.shortage.map((row) => (
            <ManageRow
              key={row.region}
              icon="car"
              title={route(row.region)}
              hint={t('waitlistTeam.people', { p: row.passengers, d: row.drivers })}
              value={perDriver(row)}
            />
          ))}
        </ManageGroup>
      ) : null}
      <GoldMore stats={value} reach={reach} />
    </>
  );
}
