import { Button, Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { useNameText } from '../way/way-end';
import type { Stop } from './driver-stops';

const MOVE_ICON = 20;

type Props = {
  readonly stops: readonly Stop[];
  readonly onMove: (index: number, by: -1 | 1) => void;
};

// The stops in the order of the way: number, place, who waits there; «Yuqoriga» and «Pastga»
// change the order when the driver knows the roads better (docs/70).
export function StopList({ stops, onMove }: Props) {
  const { t } = useI18n();
  const nameText = useNameText();
  const move = (index: number, by: -1 | 1, label: string, disabled: boolean) => (
    <Button
      mode="plain"
      size="s"
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onMove(index, by);
      }}
    >
      <Icon name={by < 0 ? 'up' : 'down'} size={MOVE_ICON} />
    </Button>
  );
  if (stops.length === 0) return <Section footer={t('way.map.empty')} />;
  return (
    <Section>
      {stops.map((stop, index) => (
        <Cell
          key={stop.id}
          before={<span className="trip-map-number">{index + 1}</span>}
          subtitle={stop.who}
          after={
            <span className="trip-map-move">
              {move(index, -1, t('way.map.up'), index === 0)}
              {move(index, 1, t('way.map.down'), index === stops.length - 1)}
            </span>
          }
        >
          {nameText(stop.name, stop.who)}
        </Cell>
      ))}
    </Section>
  );
}
