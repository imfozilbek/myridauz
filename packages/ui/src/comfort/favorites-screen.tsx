import { Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { RatingBadge } from '../feedback/rating-badge';
import { PlacesGate } from '../market/places-gate';
import { TripCard } from '../market/trip-card';
import { TripById } from '../market/trip-link';
import { useLoad } from '../market/use-list';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { BackButton } from '../telegram/back-button';
import { useScreenBackground } from '../telegram/screen-background';
import '../market/market.css';

const PHOTO_SIZE = 40;

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
  useScreenBackground('grouped');
  const { t } = useI18n();
  const { comfort } = useApiClients();
  const { value, failed, reload } = useLoad(() => comfort.favorites());
  const [opened, setOpened] = useState<string | null>(null);
  if (opened) return <TripById id={opened} onClose={() => setOpened(null)} />;
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  if (value.drivers.length === 0) {
    return (
      <>
        <BackButton onClick={onBack} />
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
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">
        {t('comfort.favorites.title')}
      </Title>
      <List>
        <Section header={t('comfort.favorites.drivers')}>
          {value.drivers.map((driver) => (
            <Cell
              key={driver.id}
              before={
                <ProfilePhoto
                  userId={driver.id}
                  name={driver.firstName}
                  hasAvatar={driver.hasAvatar}
                  size={PHOTO_SIZE}
                />
              }
              subtitle={`${driver.car.make} ${driver.car.model}, ${t(`drivers.color.${driver.car.color}`)}`}
              after={<RatingBadge rating={driver.rating} />}
            >
              {driver.firstName}
            </Cell>
          ))}
        </Section>
        {value.trips.length === 0 ? (
          <Section header={t('comfort.favorites.trips')}>
            <Cell>{t('comfort.favorites.noTrips')}</Cell>
          </Section>
        ) : null}
        {value.trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} onOpen={() => setOpened(trip.id)} />
        ))}
      </List>
    </div>
  );
}
