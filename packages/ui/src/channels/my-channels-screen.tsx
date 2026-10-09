import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { useDriver } from '../driver/driver-context';
import { Icon } from '../icons';
import { PlacesGate, usePlaces } from '../market/places-gate';
import { Screen } from '../screen/screen';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { forYou } from './for-you';
import { MyChannelRow } from './my-channel-row';
import { byRegion, matchesChannel } from './my-channels-groups';
import { useForYouCandidates } from './use-for-you';
import { useMyChannels } from './use-my-channels';
import './my-channels.css';

// «Kanallar» of a passenger and of a driver (docs/119, mockups 7-channels-2 and 7-channels-3): «Siz
// uchun» with the reason, then every channel that is made under its region, «Qoʻshilish» or «✓ Aʼzosiz».
export function MyChannelsScreen({ onBack }: { readonly onBack: () => void }) {
  return (
    <PlacesGate onBack={onBack}>
      <Channels onBack={onBack} />
    </PlacesGate>
  );
}

function Channels({ onBack }: { readonly onBack: () => void }) {
  useScreenView('profile.channels');
  useScreenBackground();
  const { t } = useI18n();
  const brand = useBrand();
  const app = useDriver() ? 'driver' : 'passenger';
  const directory = usePlaces();
  const { value, failed, reload } = useMyChannels();
  const candidates = useForYouCandidates();
  const [query, setQuery] = useState('');
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  const byName = new Map(value.map((mine) => [mine.channel.username, mine]));
  const picked = query === '' ? forYou(candidates ?? [], new Set(byName.keys())) : [];
  const groups = byRegion(
    directory,
    value.filter((mine) => matchesChannel(directory, mine, query)),
  );
  const coverage = (title: string) =>
    title.includes(', ') ? title : t('channels.mine.zone', { brand: brand.name, zone: title });
  return (
    <div className={`my-channels my-channels-${app}`} style={brandVars(brand.theme.colors)}>
      <Screen onBack={onBack} />
      <h1 className="my-channels-title">{t('channels.title')}</h1>
      <p className="my-channels-hint">{t(`channels.mine.hint.${app}`)}</p>
      <label className="my-channels-search">
        <Icon name="search" size={18} />
        <input
          type="search"
          value={query}
          placeholder={t('channels.mine.search')}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {picked.length > 0 ? (
        <>
          <h2 className="my-channels-head">{t('channels.mine.forYou')}</h2>
          <div className="my-channels-group">
            {picked.flatMap(({ username, reason }) => {
              const mine = byName.get(username);
              return mine
                ? [<MyChannelRow key={username} mine={mine} line={t(`channels.mine.reason.${reason}`)} />]
                : [];
            })}
          </div>
        </>
      ) : null}
      <h2 className="my-channels-all">{t('channels.mine.all')}</h2>
      {groups.length === 0 ? <p className="my-channels-nothing">{t('channels.mine.nothing')}</p> : null}
      {groups.map(({ region, channels }) => (
        <section key={region.id}>
          <h3 className="my-channels-head">{region.name}</h3>
          <div className="my-channels-group">
            {channels.map((mine) => (
              <MyChannelRow key={mine.channel.username} mine={mine} line={coverage(mine.channel.title)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
