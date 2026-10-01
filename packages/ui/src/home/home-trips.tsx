import { useState } from 'react';
import { Badge, Cell, Section } from '../components';
import { useChevron } from '../chevron';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { useNearWhenLabel } from '../market/when';
import type { PlaceDirectory } from '../places/directory';

type HomeRow = {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly departAt: number;
  // The status of a booking, or the new requests or free seats of a trip.
  readonly detail: string;
  // A confirmed booking or a full car: it shows at a glance, not only in the gray line.
  readonly done?: boolean;
  // The new requests of a trip: a counter like the unread one of Telegram.
  readonly count?: number;
};

type Props = {
  readonly rows: readonly HomeRow[];
  readonly directory: PlaceDirectory;
  readonly onOpen: (id: string) => void;
};

// «Yaqin safarlar» (G25): the nearest bookings or trips of the person. A tap opens one in
// «Mening safarlarim»; the data refreshes itself by the signal of the person (docs/64).
// Each fact has its own line, so a long name never hides the status (impeccable, 01.10.2026).
export function HomeTrips({ rows, directory, onOpen }: Props) {
  const { t } = useI18n();
  const when = useNearWhenLabel();
  const chevron = useChevron();
  const { colors } = useBrand().theme;
  const [now] = useState(Date.now);
  const name = (id: string) => directory.find(id)?.name ?? '';
  // The counter in the dark tone of the app: white digits stay readable (docs/20).
  const counter = (count: number) => (
    <Badge type="number" style={{ background: colors.brandText }}>
      {String(count)}
    </Badge>
  );
  return (
    <Section header={t('home.title')}>
      {rows.map((row) => (
        <Cell
          key={row.id}
          before={<IconTile name={row.done ? 'selected' : 'trip'} tone={row.done ? 'brand' : 'accent'} />}
          subtitle={when(row.departAt, now)}
          description={row.detail}
          after={chevron(row.count ? counter(row.count) : null)}
          onClick={() => onOpen(row.id)}
        >
          {t('common.route', { from: name(row.from), to: name(row.to) })}
        </Cell>
      ))}
    </Section>
  );
}
