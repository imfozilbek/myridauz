import { useI18n } from '../context/i18n-context';
import { openInTelegram } from '../telegram/feedback';
import { channelLogo } from './channel-logo';
import { channelName, type MyChannel } from './use-my-channels';
import './my-channel-row.css';

// One channel of «Kanallar» (docs/119, mockups 7-channels-2 and 7-channels-3): its logo as in Telegram
// (owner decision 13.10.2026, docs/176), its own first place, why it is here or what it covers,
// «Qoʻshilish» or the grey «✓ Aʼzosiz».
export function MyChannelRow({ mine, line }: { readonly mine: MyChannel; readonly line: string }) {
  const { t } = useI18n();
  const name = channelName(mine.channel);
  return (
    <div className="my-channel">
      <img className="my-channel-art" src={channelLogo(mine.channel)} alt={mine.channel.title} />
      <span className="my-channel-text">
        <b className="my-channel-name">{name}</b>
        <span className="my-channel-line">{line}</span>
      </span>
      <button
        type="button"
        className={mine.member ? 'my-channel-pill my-channel-in' : 'my-channel-pill'}
        onClick={() => openInTelegram(mine.link)}
      >
        {t(mine.member ? 'channels.mine.member' : 'channels.mine.join')}
      </button>
    </div>
  );
}
