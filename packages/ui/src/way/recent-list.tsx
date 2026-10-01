import type { Location, Point } from '@platform/contracts';
import { useState } from 'react';
import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { recentPlaces } from './recent-places';
import { useNameText } from './way-end';

type Props = {
  readonly find: (id: string) => Location | undefined;
  readonly onChoose: (point: Point) => void;
};

// «Oxirgi joylar» (docs/71): a tap moves the map there; the person still says «Shu yerda».
export function RecentList({ find, onChoose }: Props) {
  const { t } = useI18n();
  const nameText = useNameText();
  const [recent] = useState(recentPlaces);
  const shown = recent.flatMap((item) => {
    const place = find(item.district);
    return place ? [{ ...item, place }] : [];
  });
  if (shown.length === 0) return null;
  return (
    <Section header={t('way.point.recent')} className="pickup-map-found">
      {shown.map((item) => (
        <Cell
          key={`${item.point.lat}|${item.point.lng}`}
          before={<Icon name="history" />}
          subtitle={item.place.name}
          onClick={() => onChoose(item.point)}
        >
          {nameText(item.name, item.place)}
        </Cell>
      ))}
    </Section>
  );
}
