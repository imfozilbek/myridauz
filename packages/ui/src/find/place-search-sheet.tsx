import type { Location } from '@platform/contracts';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import type { PlaceDirectory } from '../places/directory';
import { Screen } from '../screen/screen';
import { EmptyState } from '../states/empty-state';
import { haptic } from '../telegram/feedback';
import './sheet.css';

type Props = {
  readonly directory: PlaceDirectory;
  readonly onBack: () => void;
  readonly onPick: (place: Location) => void;
};

// «Boshqa joy» (docs/118 path 2, screen 3): one search over districts and cities, no region to
// choose first. The typed beginning of a name is bold, as in the approved mockup.
export function PlaceSearchSheet({ directory, onBack, onPick }: Props) {
  useScreenView('market.otherPlace');
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const typed = query.trim();
  const found = typed === '' ? [] : directory.search(typed).filter((place) => place.parentId !== null);
  return (
    <div className="find-sheet-shade">
      <Screen onBack={onBack} />
      <div className="find-sheet" role="dialog" aria-label={t('find.other')}>
        <span className="find-sheet-handle" aria-hidden />
        <label className="find-sheet-field">
          <Icon name="search" size={18} />
          <input
            // The sheet opens to type: the keyboard comes at once (docs/118).
            autoFocus
            value={query}
            placeholder={t('find.other')}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {found.length > 0 ? <p className="find-sheet-head">{t('find.found')}</p> : null}
        {typed !== '' && found.length === 0 ? (
          <EmptyState
            icon="search"
            title={t('places.nothingFound')}
            description={t('places.nothingFoundHint')}
          />
        ) : null}
        <div className="find-sheet-list">
          {found.map((place) => (
            <button
              key={place.id}
              type="button"
              className="find-sheet-row"
              onClick={() => {
                haptic.select();
                onPick(place);
              }}
            >
              <Icon name="destination" size={22} />
              <span className="find-sheet-names">
                <span className="find-sheet-name">
                  <Typed name={place.name} typed={typed} />
                </span>
                <span className="find-sheet-region">{directory.find(place.parentId ?? '')?.name}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="find-sheet-hint">{t('find.otherHint')}</p>
      </div>
    </div>
  );
}

// The typed beginning of the name in bold: the person sees why the place was found.
function Typed({ name, typed }: { readonly name: string; readonly typed: string }) {
  const starts = name.toLowerCase().startsWith(typed.toLowerCase());
  if (!starts) return <>{name}</>;
  return (
    <>
      <b>{name.slice(0, typed.length)}</b>
      {name.slice(typed.length)}
    </>
  );
}
