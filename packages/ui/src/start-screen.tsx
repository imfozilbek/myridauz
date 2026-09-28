import { Placeholder } from '@telegram-apps/telegram-ui';
import type { LucideIcon } from 'lucide-react';
import { useBrand } from './brand-context';

const ICON_SIZE = 64;

type StartScreenProps = {
  readonly icon: LucideIcon;
  readonly description: string;
};

export function StartScreen({ icon: Icon, description }: StartScreenProps) {
  const brand = useBrand();
  return (
    <Placeholder header={brand.name} description={description}>
      <Icon size={ICON_SIZE} color={brand.theme.brand} aria-hidden />
    </Placeholder>
  );
}

export const HARD_COLOR = '#123456';
