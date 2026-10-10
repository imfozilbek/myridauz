import './row-card.css';
import type { ReactNode } from 'react';
import { Icon, type IconName } from '../icons';
import { haptic } from '../telegram/feedback';

const TILE_ICON = 20;
const ACTION_ICON = 20;

type Props = {
  readonly icon: IconName;
  // A face instead of the tile: a saved driver (mockup g75/2 A, «Sevimli haydovchilar»).
  readonly before?: ReactNode;
  readonly title: string;
  readonly hint?: ReactNode;
  // What stands on the right: the rating of a driver.
  readonly after?: ReactNode;
  // One action on the right, a red icon with its words for a screen reader: «Oʻchirish».
  readonly action?: { readonly icon: IconName; readonly label: string; readonly onClick: () => void };
  // The whole card opens its thing: a sent offer opens its chat.
  readonly onOpen?: () => void;
};

// One row on its own card (G75, mockup g75/2 A): «Obunalar», «Sevimli haydovchilar», the sent offers.
export function RowCard({ icon, before, title, hint, after, action, onOpen }: Props) {
  const open = onOpen
    ? {
        role: 'button',
        tabIndex: 0,
        onClick: () => (haptic.tap(), onOpen()),
        onKeyDown: (event: { key: string }) => event.key === 'Enter' && onOpen(),
      }
    : {};
  return (
    <div className={onOpen ? 'row-card row-card-open' : 'row-card'} {...open}>
      {before ?? (
        <span className="row-card-tile">
          <Icon name={icon} size={TILE_ICON} />
        </span>
      )}
      <span className="row-card-words">
        <b>{title}</b>
        {hint ? <span className="row-card-hint">{hint}</span> : null}
      </span>
      {after}
      {action ? (
        <button type="button" className="row-card-action" aria-label={action.label} onClick={action.onClick}>
          <Icon name={action.icon} size={ACTION_ICON} />
        </button>
      ) : null}
    </div>
  );
}
