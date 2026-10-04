import type { RideRequest, Trip } from '@platform/contracts';
import { Caption } from '@telegram-apps/telegram-ui';
import { Icon, type IconName } from '../icons';

const ICON_SIZE = 14;

export type Fact = readonly [IconName, string];

type Status = Trip['status'] | RideRequest['status'];

// A status has its own icon: a check only for what is done, a cross-out for what stopped.
const STATUS_ICON: Record<Status, IconName> = {
  active: 'trip',
  // A request waits for the offers of drivers (G37, docs/101 R8).
  open: 'waiting',
  full: 'passengers',
  matched: 'passengers',
  completed: 'selected',
  cancelled: 'blocked',
  expired: 'blocked',
};
export const statusIcon = (status: Status): IconName => STATUS_ICON[status];

// Seats, "ayol bor", the meeting point: quiet marks, an icon always with its words (docs/19).
// The marks of the search go first, in the color of links (G39, docs/104, 10).
type ChipsProps = { readonly facts: readonly Fact[]; readonly marks?: readonly Fact[] };

export function FactChips({ facts, marks = [] }: ChipsProps) {
  const chips = [
    ...marks.map((fact) => [fact, 'trip-fact trip-mark'] as const),
    ...facts.map((fact) => [fact, 'trip-fact'] as const),
  ];
  return (
    <div className="trip-card-facts">
      {chips.map(([[icon, text], className]) => (
        <Caption key={text} className={className}>
          <Icon name={icon} size={ICON_SIZE} />
          {text}
        </Caption>
      ))}
    </div>
  );
}
