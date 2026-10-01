import type { ReactNode } from 'react';
import { Cell } from './cell';
import { IconTile } from './icon-tile';
import type { IconName } from './icons';

type DangerCellProps = {
  readonly icon: IconName;
  readonly onClick: () => void;
  readonly children: ReactNode;
};

// A row of a dangerous action (delete, remove): red tile and red text, like in Telegram (docs/86 V12).
export function DangerCell({ icon, onClick, children }: DangerCellProps) {
  return (
    <Cell before={<IconTile name={icon} tone="danger" />} onClick={onClick}>
      <span className="danger-text">{children}</span>
    </Cell>
  );
}
