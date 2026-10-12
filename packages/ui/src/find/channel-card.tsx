import type { BrandChannel } from '@platform/brands';
import type { Location } from '@platform/contracts';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { useRegionArt } from '../places/region-art';
import { openInTelegram } from '../telegram/feedback';
import { WayRow } from './way-row';

type Props = {
  readonly channel: BrandChannel;
  readonly region: Location | undefined;
  readonly onClose: () => void;
};

// The channel of the direction (docs/119, mockup 7-channels-1): the new trips of the zone without
// opening the app; every post leads back to Rida (docs/18). Joined or closed: it never comes again.
export function ChannelCard({ channel, region, onClose }: Props) {
  const { t } = useI18n();
  const { name } = useBrand();
  const art = useRegionArt()(region?.id ?? '');
  return (
    <div className="channel-card">
      <div className="channel-card-top">
        {art ? <img className="channel-card-art" src={art} alt={channel.title} /> : null}
        <span className="channel-card-text">
          <span className="channel-card-name">{t('find.channel', { brand: name, zone: channel.title })}</span>
          <span className="channel-card-hint">{t('find.channelHint', { zone: channel.title })}</span>
        </span>
        <button type="button" className="channel-card-close" aria-label={t('common.close')} onClick={onClose}>
          <Icon name="close" size={18} />
        </button>
      </div>
      <button type="button" className="channel-card-join" onClick={() => join(channel, onClose)}>
        {t('find.channelJoin')}
      </button>
    </div>
  );
}

// Joined: it never comes again.
function join(channel: BrandChannel, onClose: () => void) {
  openInTelegram(channel.link);
  onClose();
}

// The channel as a row of the empty day (G78 sheet 2): the picture of the zone, one tap joins.
export function ChannelRow({ channel, region, onClose }: Props) {
  const { t } = useI18n();
  const { name } = useBrand();
  const art = useRegionArt()(region?.id ?? '');
  return (
    <WayRow
      icon={art ? { src: art, alt: channel.title } : 'channel'}
      title={t('find.channel', { brand: name, zone: channel.title })}
      hint={t('find.channelHint', { zone: channel.title })}
      onClick={() => join(channel, onClose)}
    />
  );
}
