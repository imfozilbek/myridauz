import type { Location } from '@platform/contracts';
import { useState } from 'react';
import { Cell, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { EmptyState } from '../states/empty-state';
import { Screen } from '../screen/screen';
import { haptic } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import type { PlaceDirectory } from './directory';
import { DistrictList, type RegionTrips } from './district-list';
import { usePlaceNames } from './place-names';
import { RegionGrid } from './region-grid';

const SEARCH_ICON = 20;

type PlacePickerProps = {
  readonly title: string;
  readonly directory: PlaceDirectory;
  // A passenger may search in a whole region; a trip always goes to a district or a city.
  readonly allowWholeRegion: boolean;
  readonly onPick: (place: Location) => void;
  readonly onBack: () => void;
  // «Samarqandning qaysi joyi?»: the places of one region at once (G59).
  readonly region?: Location;
  // The trips of the week of the route by place: «Tuman tanlash» of the search (G75, mockup g75/6 A).
  readonly trips?: RegionTrips | undefined;
};

// Region → district or city, or a search by name (docs/14). Choosing, not typing (docs/19).
export function PlacePicker({
  title,
  directory,
  allowWholeRegion,
  onPick,
  onBack,
  region: open,
  trips,
}: PlacePickerProps) {
  useScreenView('places.picker');
  useScreenBackground();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const names = usePlaceNames(directory);
  const [region, setRegion] = useState<Location | null>(open ?? null);
  const [query, setQuery] = useState('');
  const pick = (place: Location) => {
    haptic.select();
    if (place.parentId !== null) return onPick(place);
    setQuery('');
    setRegion(place);
  };
  const results = query.trim() === '' ? null : directory.search(query);
  return (
    <div className="places" style={brandVars(colors)}>
      <Screen onBack={region && !results ? () => setRegion(null) : onBack} />
      <h1 className="places-title">
        {region && !results ? t('places.which', { region: names.short(region) }) : title}
      </h1>
      {/* The search of the mockup g75/6 A: a white field with its glass, under the title. */}
      <label className="places-search">
        <Icon name="search" size={SEARCH_ICON} />
        <input
          placeholder={t('places.search')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {results ? (
        <List>
          <SearchResults places={results} directory={directory} onPick={pick} />
        </List>
      ) : null}
      {!results && region ? (
        <DistrictList
          region={region}
          directory={directory}
          allowWholeRegion={allowWholeRegion}
          trips={trips}
          onPick={pick}
          onWhole={() => onPick(region)}
        />
      ) : null}
      {!results && !region ? <RegionGrid regions={directory.regions} onOpen={pick} /> : null}
    </div>
  );
}

type SearchResultsProps = {
  readonly places: readonly Location[];
  readonly directory: PlaceDirectory;
  readonly onPick: (place: Location) => void;
};

function SearchResults({ places, directory, onPick }: SearchResultsProps) {
  const { t } = useI18n();
  if (places.length === 0) {
    return (
      <EmptyState icon="search" title={t('places.nothingFound')} description={t('places.nothingFoundHint')} />
    );
  }
  return (
    <Section>
      {places.map((place) => (
        <Cell
          key={place.id}
          subtitle={place.parentId === null ? undefined : directory.find(place.parentId)?.name}
          onClick={() => onPick(place)}
        >
          {place.name}
        </Cell>
      ))}
    </Section>
  );
}
