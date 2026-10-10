import { tashkentDate } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';

// The live lines of «Boshqaruv» (mockup g67/2 screen 6): «Bugun 17 ta», «3 tasida pul kam», «20 ta ·
// 41 200 obunachi», «64 ta», «3 moderator». Each one loads alone: a failed one stays empty.
export function useManagementHints() {
  const { t, formatNumber } = useI18n();
  const { market, team, pitaks } = useApiClients();
  const [today] = useState(() => tashkentDate(Date.now()));
  const trips = useLoad(() => market.teamTrips(today), 'manage.trips').value;
  const attention = useLoad(() => team.attention(), 'team.attention').value;
  const health = useLoad(() => team.channelHealth(), 'manage.channels').value;
  const places = useLoad(() => pitaks.all(), 'manage.pitaks').value;
  const members = useLoad(() => team.members(), 'manage.team').value;
  const money = attention?.signs.filter(({ sign }) => sign.kind === 'money').length;
  const subscribers = health?.channels.reduce((sum, channel) => sum + (channel.subscribers ?? 0), 0);
  const moderators = members?.members.filter((member) => member.role === 'moderator').length;
  return {
    trips: trips ? t('manage.tripsToday', { count: trips.length }) : '',
    wallets: money === undefined ? '' : t('manage.walletsLow', { count: money }),
    channels: health
      ? t('manage.channelsHint', {
          count: health.channels.length,
          subscribers: formatNumber(subscribers ?? 0),
        })
      : '',
    pitaks: places ? t('manage.count', { count: places.pitaks.length }) : '',
    team: moderators === undefined ? '' : t('manage.teamHint', { count: moderators }),
  };
}
