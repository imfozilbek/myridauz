import { useState } from 'react';
import { useChevron } from '../chevron';
import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { recentRoutes } from '../market/recent-routes';
import type { PlaceDirectory } from '../places/directory';
import type { Route } from '../places/route-screen';

type Props = { readonly directory: PlaceDirectory; readonly onOpen: (route: Route) => void };

// «Oldingi yoʻnalishlar» (G35, docs/97 K5): the last routes of the search, one tap to their trips.
// A place gone from the directory drops its route.
export function RecentRoutesSection({ directory, onOpen }: Props) {
  const { t } = useI18n();
  const chevron = useChevron();
  const [kept] = useState(recentRoutes);
  const routes = kept.flatMap((ids) => {
    const from = directory.find(ids.from);
    const to = directory.find(ids.to);
    return from && to ? [{ from, to }] : [];
  });
  if (routes.length === 0) return null;
  return (
    <Section header={t('market.recent')}>
      {routes.map((route) => (
        <Cell
          key={`${route.from.id}:${route.to.id}`}
          before={<IconTile name="history" />}
          after={chevron()}
          onClick={() => onOpen(route)}
        >
          {t('common.route', { from: route.from.name, to: route.to.name })}
        </Cell>
      ))}
    </Section>
  );
}
