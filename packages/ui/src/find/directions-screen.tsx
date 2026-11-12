import type { Location, RouteError } from '@platform/contracts';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import type { PlaceDirectory } from '../places/directory';
import { usePlaceNames } from '../places/place-names';
import { RegionTile, useRegionWords } from '../places/region-tile';
import { Screen } from '../screen/screen';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { useBrand } from '../context/brand-context';
import type { DirectionKind } from './direction-kinds';
import { PlaceSearchSheet } from './place-search-sheet';
import { useDirections } from './use-directions';
import './find.css';

type Props = {
  // The trips for a passenger, the requests for a driver (owner decision 12.11.2026).
  readonly kind: DirectionKind;
  readonly directory: PlaceDirectory;
  readonly from: Location;
  // A place of the same city: said under the search (docs/14).
  readonly error: RouteError | null;
  readonly onBack: () => void;
  readonly onChangeFrom: () => void;
  readonly onPick: (to: Location) => void;
};

// «Qayerga borasiz?» (owner decision 06.10.2026, docs/118 path 2, V2): «Qayerdan» in one line, the
// search of any other place, every region as a tile (owner, 12.11.2026). One tap opens its trips; the
// driver's «Qayerga» is the same screen with the requests of passengers (owner, 12.11.2026).
export function DirectionsScreen({ kind, directory, from, error, onBack, onChangeFrom, onPick }: Props) {
  useScreenView(kind.screen);
  useScreenBackground();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const names = usePlaceNames(directory);
  const words = useRegionWords(directory);
  const { value: cards, failed, reload } = useDirections(kind, from.id);
  const [searching, setSearching] = useState(false);
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  return (
    <div className="find" style={brandVars(colors)}>
      {searching ? null : <Screen onBack={onBack} />}
      <h1 className="find-title">{t(kind.title)}</h1>
      {/* The open sheet leaves only the title over its shade (journey screen 4). */}
      {searching ? null : (
        <>
          <p className="find-from">
            <span className="find-from-dot" aria-hidden />
            <span>{t('find.from', { place: names.from(from) })}</span>
            <span aria-hidden>·</span>
            <button type="button" className="find-link" onClick={onChangeFrom}>
              {t('find.change')}
            </button>
          </p>
          <button type="button" className="find-search" onClick={() => setSearching(true)}>
            <Icon name="search" size={18} />
            <span>{t('find.other')}</span>
          </button>
        </>
      )}
      {error ? <p className="find-error">{t(`errors.${error}`)}</p> : null}
      {cards === null ? <ScreenSkeleton /> : null}
      {/* Every region as the same tile as «Qayerdan» (owner, 12.11.2026): its trips or requests when
          there are, else how many districts it has. */}
      <div className="region-tiles">
        {cards?.map((card) => {
          const region = directory.find(card.to);
          const busy = kind.hint(t, card);
          return region ? (
            <RegionTile
              key={card.to}
              region={region}
              name={words.name(region)}
              hint={busy ?? words.districts(region)}
              strong={busy !== null}
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
