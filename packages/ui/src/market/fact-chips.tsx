import type { RideRequest, Trip } from '@platform/contracts';
import { Caption } from '@telegram-apps/telegram-ui';
import { Icon, type IconName } from '../icons';

const ICON_SIZE = 14;

export type Fact = readonly [IconName, string];

type Status = Trip['status'] | RideRequest['status'];

// A status has its own icon: a check only for what is done, a cross-out for what stopped.
const STATUS_ICON: Record<Status, IconName> = {
  active: 'trip',
  open: 'search',
  full: 'passengers',
  matched: 'passengers',
  completed: 'selected',
  cancelled: 'blocked',
  expired: 'blocked',
};
export const statusIcon = (status: Status): IconName => STATUS_ICON[status];

// Seats, "ayol bor", the meeting point: quiet marks, an icon always with its words (docs/19).
export function FactChips({ facts }: { readonly facts: readonly Fact[] }) {
  return (
    <div className="trip-card-facts">
      {facts.map(([icon, text]) => (
        <Caption key={text} className="trip-fact">
          <Icon name={icon} size={ICON_SIZE} />
          {text}
        </Caption>
      ))}
    </div>
  );
}
