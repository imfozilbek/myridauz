import type { FavoriteDriver } from '@platform/contracts';
import { Caption, Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { PersonBadge } from '../find/person-badge';
import { Cell, List, Section } from '../components';
import { RowCard } from '../mine/row-card';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { RatingBadge } from '../feedback/rating-badge';
import { FavoriteSheet } from './favorite-sheet';
import { SearchTripCard } from '../find/search-trip-card';
import { PlacesGate } from '../market/places-gate';
import { TripById } from '../market/trip-link';
import { useLoad } from '../market/use-list';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import '../market/market.css';
import '../find/trip-card.css';

// The face takes the place of the tile of a card (mockup g75/2 A).
const PHOTO_SIZE = 36;

// "Sevimli haydovchilar" (docs/18): the saved drivers and their trips; a trip opens ready to book.
export function FavoritesScreen({ onBack }: { readonly onBack: () => void }) {
  return (
    <PlacesGate onBack={onBack}>
      <Favorites onBack={onBack} />
    </PlacesGate>
  );
}

function Favorites({ onBack }: { readonly onBack: () => void }) {
  useScreenView('comfort.favorites');
  useScreenBackground();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const { comfort } = useApiClients();
  const { value, failed, reload, refresh } = useLoad(() => comfort.favorites(), 'favorites');
  const [opened, setOpened] = useState<string | null>(null);
  // The saved driver whose sheet is open (G90 PAS-4).
  const [picked, setPicked] = useState<FavoriteDriver | null>(null);
  if (opened) return <TripById id={opened} onClose={() => setOpened(null)} />;
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  if (value.drivers.length === 0) {
    return (
      <>
        <Screen onBack={onBack} onRefresh={refresh} />
        <EmptyState
          icon="favorite"
          title={t('comfort.favorites.empty')}
          description={t('comfort.favorites.emptyHint')}
        />
      </>
    );
  }
  return (
    <div className="market">
      <Screen onBack={onBack} onRefresh={refresh} />
      <Title weight="1" className="market-title">
        {t('comfort.favorites.title')}
      </Title>
      <List>
        <Caption className="market-group">{t('comfort.favorites.drivers')}</Caption>
        {/* A card for each saved driver, as «Obunalar» (G75, mockup g75/2 A). */}
        {value.drivers.map((driver) => (
          <RowCard
            key={driver.id}
            icon="favorite"
            before={
              <PersonBadge
                id={driver.id}
                name={driver.firstName}
                hasAvatar={driver.hasAvatar}
                size={PHOTO_SIZE}
                role="driver"
              />
            }
            title={driver.firstName}
            hint={`${driver.car.make} ${driver.car.model}, ${t(`drivers.color.${driver.car.color}`)}`}
            after={<RatingBadge rating={driver.rating} />}
            onOpen={() => setPicked(driver)}
          />
        ))}
        {value.trips.length === 0 ? (
          <Section header={t('comfort.favorites.trips')}>
            <Cell>{t('comfort.favorites.noTrips')}</Cell>
          </Section>
        ) : (
          // Their trips are the cards of «Safarlar», one component (G78 sheet 2).
          <div className="search-trips" style={brandVars(colors)}>
            {value.trips.map((trip) => (
              <SearchTripCard key={trip.id} trip={trip} onOpen={() => setOpened(trip.id)} />
            ))}
          </div>
        )}
      </List>
      <FavoriteSheet
        driver={picked}
        onClose={() => setPicked(null)}
        onRemoved={() => (setPicked(null), void refresh())}
      />
    </div>
  );
}
