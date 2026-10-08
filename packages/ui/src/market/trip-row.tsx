import type { ReactNode } from 'react';
import { IconTile } from '../icon-tile';
import { Icon, type IconName } from '../icons';

type Props = {
  readonly icon: IconName;
  readonly label: ReactNode;
  readonly hint?: ReactNode;
  // The control on the right: a stepper; none with «onOpen»: the row opens a screen of its own.
  readonly after?: ReactNode;
  readonly onOpen?: () => void;
  // An empty answer is grey: «Izoh (ixtiyoriy)» (mockup g63/1).
  readonly muted?: boolean;
  // Under the words, the width of the row: the way of pickup and its pitak (mockup g63/2).
  readonly children?: ReactNode;
};

// One row of «Safar» of a new trip (G63, mockups g63/1, g63/2): the icon on its light tile, the
// words, then a stepper or the chevron of a screen of its own.
export function TripRow({ icon, label, hint, after, onOpen, muted = false, children }: Props) {
  const body = (
    <>
      <IconTile name={icon} tone="mint" size="row" soft />
      <span className="seats-text">
        <span className={muted ? 'trip-row-muted' : undefined}>{label}</span>
        {hint ? <span className="seats-hint">{hint}</span> : null}
      </span>
      {onOpen ? <Icon name="next" size={10} /> : after}
      {children ? <div className="trip-row-more">{children}</div> : null}
    </>
  );
  const className = children ? 'seats-row trip-row trip-row-wide' : 'seats-row trip-row';
  return onOpen ? (
    <button type="button" className={className} onClick={onOpen}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}
