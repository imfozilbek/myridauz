import { useState } from 'react';
import { Cell, Section } from '../components';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { useLoad } from '../market/use-list';
import { addAppToHomeScreen, useCanAddToHomeScreen } from '../telegram/home-screen';

// A driver who came back for a 2nd trip gets the app on the phone's screen: one tap next time (docs/18).
const AFTER_TRIPS = 2;

export function HomeScreenOffer() {
  return useCanAddToHomeScreen() ? <AfterTrips /> : null;
}

function AfterTrips() {
  const { t } = useI18n();
  const brand = useBrand();
  const { market } = useApiClients();
  const { value } = useLoad(() => market.myTrips(), 'home.offer');
  const [added, setAdded] = useState(false);
  const done = value?.filter((trip) => trip.status === 'completed').length ?? 0;
  if (added || done < AFTER_TRIPS) return null;
  return (
    <Section>
      <Cell
        before={<IconTile name="homeScreen" tone="brand" />}
        subtitle={t('home.addToHome.hint', { brand: brand.name })}
        onClick={() => {
          addAppToHomeScreen();
          setAdded(true);
        }}
      >
        {t('home.addToHome.title')}
      </Cell>
    </Section>
  );
}
