import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { channelLogo } from '../channels/channel-logo';
import { shownName } from '../channels/channel-name';
import { MainButton } from '../telegram/bottom-button';
import { openInTelegram } from '../telegram/feedback';
import { Icon } from '../icons';
import { WaitlistSteps, WaitlistTitle } from './parts';

type Props = {
  readonly region: string;
  readonly regionName: string;
  // The chats the person is in (chat_member, G80): «✓ Aʼzosiz».
  readonly member: readonly string[];
  readonly onNext: () => void;
};
const MEMBER_ICON = 13;
type Row = {
  readonly chat: string;
  readonly name: string;
  readonly hint?: string;
  readonly logo: string;
  readonly link: string;
};

// The last step (owner decision 14.10.2026, mockup 2 screen 7): the main channel of the brand and
// every channel of the region of the route (docs/176); «Qoʻshilish» or the grey «✓ Aʼzosiz».
export function ChannelsStep({ region, regionName, member, onNext }: Props) {
  useScreenView('waitlist_channels');
  const { t } = useI18n();
  const { track } = useAnalytics();
  const brand = useBrand();
  const main: Row = {
    chat: `@${brand.mainChannel}`,
    name: t('waitlist.channels.mainName', { brand: brand.name }),
    hint: t('waitlist.channels.mainHint'),
    logo: `${import.meta.env.BASE_URL}logo.svg`,
    link: `https://t.me/${brand.mainChannel}`,
  };
  const zone = brand.channels
    .filter((channel) => channel.places.some((place) => place.startsWith(region)))
    .map((channel) => ({
      chat: channel.chat,
      name: shownName(brand, channel.name),
      logo: channelLogo(channel),
      link: channel.link,
    }));
  const join = (row: Row) => {
    track({ name: 'waitlist_step', screen: 'waitlist_channels', step: 'channel_join' });
    openInTelegram(row.link);
  };
  const line = (row: Row) => (
    <div key={row.chat} className="wl-chan">
      <img className="wl-chan-logo" src={row.logo} alt={row.name} />
      <span className="wl-cell-text">
        <b className="wl-chan-name">{row.name}</b>
        {row.hint ? <span className="wl-cell-hint">{row.hint}</span> : null}
      </span>
      {member.includes(row.chat) ? (
        <span className="wl-pill wl-pill-in">
          <Icon name="selected" size={MEMBER_ICON} />
          {t('waitlist.channels.member')}
        </span>
      ) : (
        <button type="button" className="wl-pill" onClick={() => join(row)}>
          {t('waitlist.channels.join')}
        </button>
      )}
    </div>
  );
  return (
    <>
      <WaitlistSteps at={4} />
      <WaitlistTitle title={t('waitlist.channels.title')} hint={t('waitlist.channels.hint')} />
      <h2 className="wl-head">{t('channels.fixed')}</h2>
      <div className="wl-card">{line(main)}</div>
      {zone.length > 0 ? (
        <>
          <h2 className="wl-head">{regionName}</h2>
          <div className="wl-card">{zone.map(line)}</div>
        </>
      ) : null}
      <MainButton text={t('common.continue')} onClick={onNext} />
    </>
  );
}
