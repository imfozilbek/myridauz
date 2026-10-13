import type { Trip } from '@platform/contracts';
import { channelLogo } from '../channels/channel-logo';
import { channelName } from '../channels/channel-name';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { usePlaces } from '../market/places-gate';
import { useRegionArt } from '../places/region-art';
import { openInTelegram } from '../telegram/feedback';
import { shareCard } from '../telegram/share-card';
import { regionOf } from '../way/way-end';
import { useTripPublicity } from './use-trip-publicity';
import './trip-publicity.css';

// The chevron of the channel and the paper plane of the link (mockup g59/7-channels-3 phone 1).
const CHEVRON = 15;
const SEND = 18;

// «Safaringiz kanalda chiqdi» on «Mening safarim» (owner decision 08.10.2026, docs/119 row 1): the
// channel of the direction that posted the trip, how many people opened it in the app, and the link
// of the trip for the passengers the driver knows. The channel part waits for the first post.
export function TripPublicity({ trip }: { readonly trip: Trip }) {
  const { t, formatNumber } = useI18n();
  const brand = useBrand();
  const directory = usePlaces();
  const art = useRegionArt();
  const publicity = useTripPublicity(trip.id);
  if (!publicity) return null;
  const channel = publicity.channels.find((item) => item.posted);
  // The name the channel has in Telegram, without the brand (owner 13.10.2026, docs/176).
  const name = channel ? channelName(brand, channel) : '';
  // The logo of a channel of the brand as in Telegram (docs/176); a team channel: the region of the end.
  const own = brand.channels.find((item) => item.chat === channel?.chat);
  const end = directory.find(trip.to);
  const picture = own ? channelLogo(own) : art(end ? regionOf(end) : trip.to);
  const views = formatNumber(publicity.views);
  return (
    <div className="own-channel">
      {channel ? (
        <button type="button" className="own-channel-top" onClick={() => openInTelegram(channel.link)}>
          {picture ? <img className="own-channel-art" src={picture} alt={name} /> : null}
          <span className="own-channel-text">
            <b>{t('driverTrip.channel.title')}</b>
            <span>
              {publicity.views > 0 ? t('driverTrip.channel.views', { channel: name, count: views }) : name}
            </span>
          </span>
          <Icon name="next" size={CHEVRON} />
        </button>
      ) : null}
      <button
        type="button"
        className="own-channel-share"
        onClick={() => void shareCard(null, publicity.link)}
      >
        <Icon name="send" size={SEND} />
        <span>{t('driverTrip.channel.share')}</span>
      </button>
    </div>
  );
}
