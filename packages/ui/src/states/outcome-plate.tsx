import { Icon } from '../icons';
import './outcome-plate.css';

const TILE_ICON = 22;

type Props = {
  // A tick when it went (or went well once), a cross when it ended without a trip.
  readonly tick: boolean;
  // Grey: it ended without a trip, or it is long over (g60/6).
  readonly off: boolean;
  readonly title: string;
  readonly lines: readonly string[];
};

// One plate of how a thing ended (G75, docs/158 А): a seat, «Safar» and a request say it the same
// way, on top of their page: a tile, what happened, when and why.
export function OutcomePlate({ tick, off, title, lines }: Props) {
  return (
    <div className={off ? 'outcome-plate outcome-plate-off' : 'outcome-plate'}>
      <span className="outcome-plate-tile">
        <Icon name={tick ? 'selected' : 'close'} size={TILE_ICON} />
      </span>
      <span className="outcome-plate-text">
        <b>{title}</b>
        {lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </span>
    </div>
  );
}
