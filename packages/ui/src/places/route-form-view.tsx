import { type Location, type RouteError } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { PlaceRow } from './district-list';
import './places.css';

type RouteViewProps = {
  readonly from: Location | null;
  readonly to: Location | null;
  readonly error: RouteError | null;
  readonly onPick: (end: 'from' | 'to') => void;
  readonly onBack: () => void;
  readonly onSubmit: () => void;
};

// «Qayerdan» and «Qayerga» of a route on one card, then «Davom etish» (G26, mockup g75/6 A).
export function RouteView({ from, to, error, onPick, onBack, onSubmit }: RouteViewProps) {
  useScreenView('places.route');
  useScreenBackground();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const value = (place: Location | null) => (place ? place.name : t('places.choose'));
  // The ends in the look of the places of the mockup g75/6 A: one white card, a row for each end.
  return (
    <div className="places" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <h1 className="places-title">{t('places.route')}</h1>
      <div className="district-card">
        <PlaceRow
          icon="origin"
          className="route-from"
          title={t('places.from')}
          hint={value(from)}
          onClick={() => onPick('from')}
        />
        <PlaceRow
          icon="destination"
          className="route-to"
          title={t('places.to')}
          hint={value(to)}
          onClick={() => onPick('to')}
        />
      </div>
      {error ? <Text className="places-error">{t(`errors.${error}`)}</Text> : null}
      <MainButton text={t('common.continue')} onClick={onSubmit} />
    </div>
  );
}
