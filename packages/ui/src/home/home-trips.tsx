import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { useWhenLabel } from '../market/when';
import type { PlaceDirectory } from '../places/directory';

type HomeRow = {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly departAt: number;
  // The status of a booking, or the new requests of a trip.
  readonly detail: string;
};

type Props = {
  readonly rows: readonly HomeRow[];
  readonly more: boolean;
  readonly directory: PlaceDirectory;
  readonly onOpen: (id: string) => void;
  readonly onAll: () => void;
};

// «Yaqin safarlar» (G25): the nearest bookings or trips of the person. A tap opens one in
// «Mening safarlarim»; the data refreshes itself by the signal of the person (docs/64).
export function HomeTrips({ rows, more, directory, onOpen, onAll }: Props) {
  const { t } = useI18n();
  const when = useWhenLabel();
  const name = (id: string) => directory.find(id)?.name ?? '';
  return (
    <Section header={t('home.title')}>
      {rows.map((row) => (
        <Cell
          key={row.id}
          before={<IconTile name="trip" tone="accent" />}
          subtitle={`${when(row.departAt)} · ${row.detail}`}
          onClick={() => onOpen(row.id)}
        >
          {`${name(row.from)} → ${name(row.to)}`}
        </Cell>
      ))}
      {more ? (
        <Cell before={<IconTile name="myTrips" tone="deep" />} onClick={onAll}>
          {t('home.all')}
        </Cell>
      ) : null}
    </Section>
  );
}
