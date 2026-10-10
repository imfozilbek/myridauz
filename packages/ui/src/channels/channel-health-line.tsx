import type { ChannelHealth } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';

type Health = ChannelHealth['channels'][number];

// The health of a channel under its name (G75, docs/120, docs/119): how many are in it, who came by
// its posts this month, and in red when the bot may not post or posts did not go this week.
export function ChannelHealthLine({ health }: { readonly health: Health | undefined }) {
  const { t, formatNumber } = useI18n();
  if (!health) return null;
  const subscribers =
    health.subscribers === null
      ? ''
      : t('manage.channel.subscribers', { count: formatNumber(health.subscribers) });
  const line = [subscribers, t('manage.channel.arrivals', { count: health.arrivals })]
    .filter(Boolean)
    .join(' · ');
  const trouble =
    health.canPost === false
      ? t('manage.channel.noPost')
      : health.failed > 0
        ? t('manage.channel.failed', { count: health.failed })
        : null;
  return (
    <>
      {line}
      {trouble ? <span className="danger-text danger-line">{trouble}</span> : null}
    </>
  );
}
