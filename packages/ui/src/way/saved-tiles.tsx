import type { Location, Pitak } from '@platform/contracts';
import { useState } from 'react';
import { useI18n } from '../context/i18n-context';
import { Icon, type IconName } from '../icons';
import { haptic } from '../telegram/feedback';
import { savedPlaces, savePlace, type SavedKind } from './saved-places';
import { useNameText, type PointEnd } from './way-end';

type Props = {
  // The place under the pin: «Saqlash» keeps it.
  readonly current: PointEnd | null;
  readonly find: (id: string) => Location | undefined;
  readonly onPick: (end: PointEnd) => void;
  readonly pitak?: Pitak;
  readonly onPitak?: () => void;
};

// «Uyim», «Ishxonam» (docs/126) and the pitak of the trip: one tap takes the place. A place not kept
// yet says «Saqlash»: the place under the pin is kept for the next time.
export function SavedTiles({ current, find, onPick, pitak, onPitak }: Props) {
  const { t } = useI18n();
  const nameText = useNameText();
  const [saved, setSaved] = useState(savedPlaces);
  const tile = (key: string, icon: IconName, title: string, hint: string, onClick: () => void) => (
    <button key={key} type="button" className="way-tile" onClick={onClick}>
      <Icon name={icon} size={20} />
      <span className="way-tile-text">
        <b>{title}</b>
        <span>{hint}</span>
      </span>
    </button>
  );
  const kept = (kind: SavedKind) => {
    const place = saved[kind];
    const district = place ? find(place.district) : undefined;
    const title = t(kind === 'home' ? 'way.saved.home' : 'way.saved.work');
    if (place && district)
      return tile(kind, kind === 'home' ? 'door' : 'work', title, nameText(place.name, district), () =>
        onPick({ place: district, point: place.point, name: place.name }),
      );
    return tile(kind, kind === 'home' ? 'door' : 'work', title, t('way.saved.keep'), () => {
      if (!current) return haptic.error();
      savePlace(kind, { point: current.point, name: current.name, district: current.place.id });
      haptic.success();
      return setSaved(savedPlaces());
    });
  };
  return (
    <div className="way-tiles">
      {pitak && onPitak ? tile('pitak', 'pitak', pitak.name, t('way.mode.pitak'), onPitak) : null}
      {kept('home')}
      {kept('work')}
    </div>
  );
}
