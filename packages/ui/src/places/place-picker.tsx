import type { Location } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { Cell, Input, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { EmptyState } from '../states/empty-state';
import { Screen } from '../screen/screen';
import { haptic } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import type { PlaceDirectory } from './directory';
import { RegionGrid } from './region-grid';

type PlacePickerProps = {
  readonly title: string;
  readonly directory: PlaceDirectory;
  // A passenger may search in a whole region; a trip always goes to a district or a city.
  readonly allowWholeRegion: boolean;
  readonly onPick: (place: Location) => void;
  readonly onBack: () => void;
  // «Samarqandning qaysi joyi?»: the places of one region at once (G59).
  readonly region?: Location;
};

// Region → district or city, or a search by name (docs/14). Choosing, not typing (docs/19).
export function PlacePicker({
  title,
  directory,
  allowWholeRegion,
  onPick,
  onBack,
  region: open,
}: PlacePickerProps) {
  useScreenView('places.picker');
  useScreenBackground();
  const { t } = useI18n();
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
    <div className="places">
      <Screen onBack={region && !results ? () => setRegion(null) : onBack} />
      <Title weight="1" className="places-title">
        {region && !results ? region.name : title}
      </Title>
      <List>
        <Section>
          <Input
            before={<Icon name="search" size={20} />}
            placeholder={t('places.search')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </Section>
        {results ? <SearchResults places={results} directory={directory} onPick={pick} /> : null}
        {!results && region ? (
          <Section>
            {allowWholeRegion ? (
              <Cell before={<Icon name="destination" />} onClick={() => onPick(region)}>
                {t(region.oneCity ? 'places.wholeCity' : 'places.wholeRegion')}
              </Cell>
            ) : null}
            {directory.inside(region.id).map((place) => (
              <Cell key={place.id} onClick={() => pick(place)}>
                {place.name}
              </Cell>
            ))}
          </Section>
        ) : null}
      </List>
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
