import { channelLogo } from '../../channels/channel-logo';
import { shownName } from '../../channels/channel-name';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { useMyChannels } from '../../channels/use-my-channels';
import { ProfileRow } from './profile-row';

// The logos of the first channels the person is in (mockup 7-channels-3, phone 1; docs/176).
const LOGOS = 3;

// «Kanallar» in «Profil» (docs/119): in how many channels the person is, their small logos; it opens
// all the channels of the brand.
export function ChannelsRow({ onOpen }: { readonly onOpen: () => void }) {
  const { t } = useI18n();
  const brand = useBrand();
  const { value } = useMyChannels();
  const joined = value?.filter((mine) => mine.member) ?? [];
  // The pictures are files of the brand: the server only says in which channels the person is.
  const logos = brand.channels
    .filter((own) => joined.some(({ channel }) => channel.chat === own.chat))
    .slice(0, LOGOS);
  return (
    <ProfileRow
      icon="channel"
      title={t('channels.title')}
      hint={joined.length > 0 ? t('account.profile.channels', { count: String(joined.length) }) : undefined}
      after={
        logos.length > 0 ? (
          <span className="profile-arts" aria-hidden>
            {logos.map((channel) => (
              <img key={channel.chat} src={channelLogo(channel)} alt={shownName(brand, channel.name)} />
            ))}
          </span>
        ) : undefined
      }
      chevron
      onClick={onOpen}
    />
  );
}
