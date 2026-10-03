import type { Location } from '@platform/contracts';
import { useState } from 'react';
import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { recentPlaces } from './recent-places';
import { useNameText, type PointEnd } from './way-end';

// Two places are enough to see the map above them on a small phone (G36, docs/100 DS4).
const SHOWN = 2;

type Props = {
  readonly find: (id: string) => Location | undefined;
  readonly onChoose: (end: PointEnd) => void;
};

// «Oxirgi joylar» (docs/71): the name and its district; a tap takes the place at once (G36, docs/100).
export function RecentList({ find, onChoose }: Props) {
  const { t } = useI18n();
  const nameText = useNameText();
  const [recent] = useState(recentPlaces);
  const shown = recent
    .flatMap((item) => {
      const place = find(item.district);
      return place ? [{ ...item, place }] : [];
    })
    .slice(0, SHOWN);
  if (shown.length === 0) return null;
  return (
    <Section header={t('way.point.recent')} className="way-recent">
      {shown.map((item) => (
        <Cell
          key={`${item.point.lat}|${item.point.lng}`}
          before={<Icon name="history" />}
          subtitle={item.place.name}
          onClick={() => onChoose({ place: item.place, point: item.point, name: item.name })}
        >
          {nameText(item.name, item.place)}
        </Cell>
      ))}
    </Section>
  );
}
