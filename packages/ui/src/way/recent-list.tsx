import type { Location } from '@platform/contracts';
import { useState } from 'react';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { recentPlaces } from './recent-places';
import type { PointEnd } from './way-end';

// Two places are enough to see the map above them on a small phone (G36, docs/100 DS4).
const SHOWN = 2;

type Props = {
  readonly find: (id: string) => Location | undefined;
  readonly onChoose: (end: PointEnd) => void;
};

// «Oxirgi joylar» (docs/71): a chip with the name of each place, one tap takes it at once
// (G36, docs/100; mockup screen 9).
export function RecentList({ find, onChoose }: Props) {
  const { t, placeName } = useI18n();
  const [recent] = useState(recentPlaces);
  // A place remembered before G98 has its name in Latin: shown and taken in the alphabet of the text.
  const shown = recent
    .flatMap((item) => {
      const place = find(item.district);
      const name = item.name && { ...item.name, name: placeName(item.name.name) };
      return place ? [{ ...item, place, name }] : [];
    })
    .slice(0, SHOWN);
  if (shown.length === 0) return null;
  return (
    <>
      <p className="way-sheet-head">{t('way.point.recent')}</p>
      <div className="way-chips">
        {shown.map((item) => (
          <button
            key={`${item.point.lat}|${item.point.lng}`}
            type="button"
            className="way-chip"
            onClick={() => onChoose({ place: item.place, point: item.point, name: item.name })}
          >
            <Icon name="history" size={15} />
            {item.name?.name ?? item.place.name}
          </button>
        ))}
      </div>
    </>
  );
}
