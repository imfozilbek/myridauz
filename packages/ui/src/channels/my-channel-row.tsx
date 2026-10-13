import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { openInTelegram } from '../telegram/feedback';
import { channelLogo } from './channel-logo';
import { shownName } from './channel-name';
import type { MyChannel } from './use-my-channels';
import './my-channel-row.css';

type Props = { readonly mine: MyChannel; readonly line?: string };

// One channel of «Kanallar» (docs/119, mockups 7-channels-2 and 7-channels-3): its logo and its name
// as in Telegram without the brand (owner decisions 13.10.2026, docs/176), why it is here in «Siz uchun», «Qoʻshilish»
// or the grey «✓ Aʼzosiz».
export function MyChannelRow({ mine, line }: Props) {
  const { t } = useI18n();
  const name = shownName(useBrand(), mine.channel.name);
  return (
    <div className="my-channel">
      <img className="my-channel-art" src={channelLogo(mine.channel)} alt={name} />
      <span className="my-channel-text">
        <b className="my-channel-name">{name}</b>
        {line ? <span className="my-channel-line">{line}</span> : null}
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
