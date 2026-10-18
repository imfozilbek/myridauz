import type { ChannelHealth } from '@platform/contracts';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageRow } from '../manage/manage-page';
import { channelName } from './channel-name';

// «7 kunda kelgan va ketganlar» of the owner (G87 V5, docs/176): the channels people came to or left
// this week, the busiest first, with the people in each by the last check. Only numbers.
export function ChannelMoves({ health }: { readonly health: ChannelHealth }) {
  const { t, formatNumber } = useI18n();
  const brand = useBrand();
  const moved = health.channels
    .filter(({ joined, left }) => joined + left > 0)
    .sort((one, other) => other.joined + other.left - (one.joined + one.left));
  if (moved.length === 0) return null;
  return (
    <ManageGroup title={t('manage.channel.movesTitle')}>
      {moved.map((channel) => (
        <ManageRow
          key={channel.chat}
          icon="channel"
          title={channelName(brand, channel)}
          hint={t('manage.channel.moves', {
            joined: formatNumber(channel.joined),
            left: formatNumber(channel.left),
          })}
          {...(channel.subscribers === null ? {} : { value: formatNumber(channel.subscribers) })}
        />
      ))}
    </ManageGroup>
  );
}
