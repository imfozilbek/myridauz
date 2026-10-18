import { channelPostLink, type ChannelHealth } from '@platform/contracts';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageRow } from '../manage/manage-page';
import { openInTelegram } from '../telegram/feedback';
import { channelName } from './channel-name';

// «7 kunda koʻp reaksiya olgan postlar» of the owner (G87 V6, docs/176): the post with the most
// reactions of each channel this week, the most first; a tap opens the post in Telegram.
export function ChannelReactions({ health }: { readonly health: ChannelHealth }) {
  const { t, formatNumber } = useI18n();
  const brand = useBrand();
  const posts = health.channels
    .flatMap((channel) => (channel.topPost ? [{ channel, post: channel.topPost }] : []))
    .sort((one, other) => other.post.reactions - one.post.reactions);
  if (posts.length === 0) return null;
  return (
    <ManageGroup title={t('manage.channel.reactionsTitle')}>
      {posts.map(({ channel, post }) => (
        <ManageRow
          key={channel.chat}
          icon="favorite"
          title={channelName(brand, channel)}
          hint={t('manage.channel.reactions', { count: formatNumber(post.reactions) })}
          onClick={() => openInTelegram(channelPostLink(channel.chat, post.messageId))}
        />
      ))}
    </ManageGroup>
  );
}
