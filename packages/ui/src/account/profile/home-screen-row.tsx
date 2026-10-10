import { useState } from 'react';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { addAppToHomeScreen, useCanAddToHomeScreen } from '../../telegram/home-screen';
import { ProfileRow } from './profile-row';

// The app on the phone's screen (docs/88 L17): a row of «Sozlamalar» while Telegram can add it
// (owner decision 10.10.2026, docs/159); once added, the row is gone.
export function HomeScreenRow() {
  const { t } = useI18n();
  const brand = useBrand();
  const can = useCanAddToHomeScreen();
  const [added, setAdded] = useState(false);
  if (!can || added) return null;
  return (
    <ProfileRow
      icon="homeScreen"
      title={t('home.addToHome.title')}
      hint={t('home.addToHome.hint', { brand: brand.name })}
      onClick={() => {
        addAppToHomeScreen();
        setAdded(true);
      }}
    />
  );
}
