import { useI18n } from '../../context/i18n-context';
import { channelLogo } from '../../channels/channel-logo';
import { useMyChannels } from '../../channels/use-my-channels';
import { ProfileRow } from './profile-row';

// The logos of the first channels the person is in (mockup 7-channels-3, phone 1; docs/176).
const LOGOS = 3;

// «Kanallar» in «Profil» (docs/119): in how many channels the person is, their small logos; it opens
// all the channels of the brand.
export function ChannelsRow({ onOpen }: { readonly onOpen: () => void }) {
  const { t } = useI18n();
  const { value } = useMyChannels();
  const joined = value?.filter((mine) => mine.member) ?? [];
  const logos = joined.slice(0, LOGOS).map(({ channel }) => channel);
  return (
    <ProfileRow
      icon="channel"
      title={t('channels.title')}
      hint={joined.length > 0 ? t('account.profile.channels', { count: String(joined.length) }) : undefined}
      after={
        logos.length > 0 ? (
          <span className="profile-arts" aria-hidden>
            {logos.map((channel) => (
              <img key={channel.chat} src={channelLogo(channel)} alt={channel.title} />
            ))}
          </span>
        ) : undefined
      }
      chevron
      onClick={onOpen}
    />
  );
}
