import { Placeholder } from '@telegram-apps/telegram-ui';
import type { ReactNode } from 'react';
import { useBrand } from '../context/brand-context';
import { Icon, type IconName } from '../icons';

const ICON_SIZE = 56;

type EmptyStateProps = {
  readonly icon?: IconName;
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
};

// An empty screen always explains what to do (docs/19, principle 8).
export function EmptyState({ icon = 'empty', title, description, action }: EmptyStateProps) {
  const { colors } = useBrand().theme;
  return (
    <Placeholder header={title} description={description} action={action}>
      <Icon name={icon} size={ICON_SIZE} color={colors.brand} />
    </Placeholder>
  );
}
