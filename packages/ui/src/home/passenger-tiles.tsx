import { useState } from 'react';
import { useI18n } from '../context/i18n-context';
import { HomeTile } from '../flow/home-tile';
import type { HomeGo } from '../flow/start-action';
import { recentRoutes } from '../market/recent-routes';
import { useDirectory } from '../places/use-directory';
import { useHomeTap } from './use-home-tap';

type Props = { readonly go: HomeGo; readonly openProfile: () => void };

// The tiles of a passenger after the actions (owner decision 04.10.2026, G53): the last route of the
// search, one tap to its trips (G35 K5), and the profile. Without a known route the profile takes
// the whole row.
export function PassengerTiles({ go, openProfile }: Props) {
  const { t } = useI18n();
  const tap = useHomeTap();
  const [places] = useDirectory();
  const [kept] = useState(recentRoutes);
  const directory = places.status === 'ready' ? places.directory : null;
  const route = kept.flatMap((ids) => {
    const from = directory?.find(ids.from);
    const to = directory?.find(ids.to);
    return from && to ? [{ from, to }] : [];
  })[0];
  return (
    <>
      {route ? (
        <HomeTile
          icon="history"
          tone="brand"
          title={t('home.driver.last')}
          hint={t('common.route', { from: route.from.name, to: route.to.name })}
          onClick={tap('last_route', () => go('find_trip', { route }))}
        />
      ) : null}
      <HomeTile
        icon="profile"
        tone="deep"
        title={t('account.profile.title')}
        hint={t('home.profileHint')}
        onClick={openProfile}
      />
    </>
  );
}
