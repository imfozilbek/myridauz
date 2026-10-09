import { useI18n } from '../context/i18n-context';
import { usePlaces } from '../market/places-gate';
import { useRegionArt } from '../places/region-art';
import { openInTelegram } from '../telegram/feedback';
import { channelRegion, type MyChannel } from './use-my-channels';
import './my-channel-row.css';

// One channel of «Kanallar» (docs/119, mockups 7-channels-2 and 7-channels-3): the drawing of its
// region, its first place, why it is here or what it covers, «Qoʻshilish» or the grey «✓ Aʼzosiz».
export function MyChannelRow({ mine, line }: { readonly mine: MyChannel; readonly line: string }) {
  const { t } = useI18n();
  const art = useRegionArt();
  const region = channelRegion(usePlaces(), mine.channel);
  const src = region ? art(region.id) : null;
  const [name] = mine.channel.title.split(', ');
  return (
    <div className="my-channel">
      {src ? (
        <img className="my-channel-art" src={src} alt={region?.name} />
      ) : (
        <span className="my-channel-art" />
      )}
      <span className="my-channel-text">
        <b className="my-channel-name">{name}</b>
        <span className="my-channel-line">{line}</span>
      </span>
      <button
        type="button"
        className={mine.member ? 'my-channel-pill my-channel-in' : 'my-channel-pill'}
        onClick={() => openInTelegram(`https://t.me/${mine.channel.username}`)}
      >
        {t(mine.member ? 'channels.mine.member' : 'channels.mine.join')}
      </button>
    </div>
  );
}
