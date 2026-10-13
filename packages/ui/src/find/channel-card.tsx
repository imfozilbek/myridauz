import type { BrandChannel } from '@platform/brands';
import { channelLogo } from '../channels/channel-logo';
import { shownName } from '../channels/channel-name';
import { useChannelLink } from '../channels/use-my-channels';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { openInTelegram } from '../telegram/feedback';
import { WayRow } from './way-row';

type Props = { readonly channel: BrandChannel; readonly onClose: () => void };

// The channel of the direction (docs/119, mockup 7-channels-1) with its logo and name from Telegram
// without the brand (owner 13.10.2026, docs/176); the hint does not say the places again, the name
// says them. The new trips of the zone without opening the app; every post leads back to Rida
// (docs/18). Joined or closed: it never comes again.
export function ChannelCard({ channel, onClose }: Props) {
  const { t } = useI18n();
  const link = useChannelLink(channel);
  const name = shownName(useBrand(), channel.name);
  return (
    <div className="channel-card">
      <div className="channel-card-top">
        <img className="channel-card-art" src={channelLogo(channel)} alt={name} />
        <span className="channel-card-text">
          <span className="channel-card-name">{name}</span>
          <span className="channel-card-hint">{t('find.channelHint')}</span>
        </span>
        <button type="button" className="channel-card-close" aria-label={t('common.close')} onClick={onClose}>
          <Icon name="close" size={18} />
        </button>
      </div>
      <button type="button" className="channel-card-join" onClick={() => join(link, onClose)}>
        {t('find.channelJoin')}
      </button>
    </div>
  );
}

// Joined: it never comes again.
function join(link: string, onClose: () => void) {
  openInTelegram(link);
  onClose();
}

// The channel as a row of the empty day (G78 sheet 2): the logo of the channel, one tap joins.
export function ChannelRow({ channel, onClose }: Props) {
  const { t } = useI18n();
  const link = useChannelLink(channel);
  const name = shownName(useBrand(), channel.name);
  return (
    <WayRow
      icon={{ src: channelLogo(channel), alt: name }}
      title={name}
      hint={t('find.channelHint')}
      onClick={() => join(link, onClose)}
    />
  );
}
