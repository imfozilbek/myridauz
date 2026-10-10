import './empty-state.css';
import type { ReactNode } from 'react';
import { useBrand } from '../context/brand-context';
import { Icon, type IconName } from '../icons';

const ICON_SIZE = 36;

export type EmptyStateProps = {
  readonly icon?: IconName;
  // A block or an error is red; anything else in the color of the app (mockup g75/1 A).
  readonly tone?: 'brand' | 'danger';
  readonly title: string;
  readonly description?: string;
  // A second line under the words: «Savollar boʻlsa, …» of a block (mockup g75/1 A).
  readonly note?: string;
  readonly action?: ReactNode;
};

// An empty screen always explains what to do (docs/19, principle 8): the big tile, the title, the words
// and one action in the middle of the screen (G75, mockups g75/1 A and g75/2 A).
export function EmptyState(props: EmptyStateProps) {
  const { icon = 'empty', tone = 'brand', title, description, note, action } = props;
  const { colors } = useBrand().theme;
  const danger = tone === 'danger';
  return (
    <div className="empty-state" style={{ color: colors.text }}>
      <span
        className="empty-state-tile"
        style={{ background: danger ? colors.dangerTile : colors.stateTile }}
      >
        <Icon name={icon} size={ICON_SIZE} color={danger ? colors.danger : colors.brandText} />
      </span>
      <h2>{title}</h2>
      {description ? <p style={{ color: colors.textMuted }}>{description}</p> : null}
      {note ? <p style={{ color: colors.textMuted }}>{note}</p> : null}
      {action}
    </div>
  );
}
