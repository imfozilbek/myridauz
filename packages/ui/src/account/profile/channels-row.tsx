import { useI18n } from '../../context/i18n-context';
import { channelRegion, useMyChannels } from '../../channels/use-my-channels';
import { useRegionArt } from '../../places/region-art';
import { useDirectory } from '../../places/use-directory';
import { ProfileRow } from './profile-row';

// The drawings of the first channels the person is in (mockup 7-channels-3, phone 1).
const ARTS = 3;

// «Kanallar» in «Profil» (docs/119): in how many channels the person is, their small drawings; it
// opens all the channels of the brand.
export function ChannelsRow({ onOpen }: { readonly onOpen: () => void }) {
  const { t } = useI18n();
  const { value } = useMyChannels();
  const [directory] = useDirectory();
  const art = useRegionArt();
  const joined = value?.filter((mine) => mine.member) ?? [];
  const arts =
    directory.status === 'ready'
      ? joined.slice(0, ARTS).flatMap(({ channel }) => {
          const region = channelRegion(directory.directory, channel);
          const src = region ? art(region.id) : null;
          return src ? [{ username: channel.username, title: channel.title, src }] : [];
        })
      : [];
  return (
    <ProfileRow
      icon="channel"
      title={t('channels.title')}
      hint={joined.length > 0 ? t('account.profile.channels', { count: String(joined.length) }) : undefined}
      after={
        arts.length > 0 ? (
          <span className="profile-arts" aria-hidden>
            {arts.map(({ username, title, src }) => (
              <img key={username} src={src} alt={title} />
            ))}
          </span>
        ) : undefined
      }
      chevron
      onClick={onOpen}
    />
  );
}
