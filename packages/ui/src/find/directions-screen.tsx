import type { Location, RouteError } from '@platform/contracts';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import type { PlaceDirectory } from '../places/directory';
import { usePlaceNames } from '../places/place-names';
import { Screen } from '../screen/screen';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { useBrand } from '../context/brand-context';
import { DirectionCard } from './direction-card';
import { PlaceSearchSheet } from './place-search-sheet';
import { useDirections } from './use-directions';
import './find.css';

type Props = {
  readonly directory: PlaceDirectory;
  readonly from: Location;
  // A place of the same city: said under the search (docs/14).
  readonly error: RouteError | null;
  readonly onBack: () => void;
  readonly onChangeFrom: () => void;
  readonly onPick: (to: Location) => void;
};

// «Qayerga borasiz?» (owner decision 06.10.2026, docs/118 path 2, V2): «Qayerdan» in one line, the
// search of any other place, the main directions as cards. One tap on a card opens its trips.
export function DirectionsScreen({ directory, from, error, onBack, onChangeFrom, onPick }: Props) {
  useScreenView('market.directions');
  useScreenBackground('tinted');
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const names = usePlaceNames(directory);
  const { value: cards, failed, reload } = useDirections(from.id);
  const [searching, setSearching] = useState(false);
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  return (
    <div className="find" style={brandVars(colors)}>
      {searching ? null : <Screen onBack={onBack} />}
      <h1 className="find-title">{t('find.title')}</h1>
      <p className="find-from">
        <span className="find-from-dot" aria-hidden />
        <span>{t('find.from', { place: names.full(from) })}</span>
        <span aria-hidden>·</span>
        <button type="button" className="find-link" onClick={onChangeFrom}>
          {t('find.change')}
        </button>
      </p>
      <button type="button" className="find-search" onClick={() => setSearching(true)}>
        <Icon name="search" size={18} />
        <span>{t('find.other')}</span>
      </button>
      {error ? <p className="find-error">{t(`errors.${error}`)}</p> : null}
      {cards === null ? <ScreenSkeleton /> : null}
      <div className="direction-list">
        {cards?.map((card) => {
          const region = directory.find(card.to);
          return region ? (
            <DirectionCard
              key={card.to}
              card={card}
              region={region}
              name={names.short(region)}
              onOpen={() => onPick(region)}
            />
          ) : null;
        })}
      </div>
      {searching ? (
        <PlaceSearchSheet
          directory={directory}
          onBack={() => setSearching(false)}
          onPick={(place) => {
            setSearching(false);
            onPick(place);
          }}
        />
      ) : null}
    </div>
  );
}
