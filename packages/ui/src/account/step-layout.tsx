import { Text, Title } from '@telegram-apps/telegram-ui';
import type { ReactNode } from 'react';
import { IconTile } from '../icon-tile';
import type { IconName } from '../icons';
import { useScreenBackground } from '../telegram/screen-background';

type StepLayoutProps = {
  readonly icon: IconName;
  readonly title: string;
  readonly hint?: string;
  readonly children?: ReactNode;
};

// One screen, one question: an icon, a short title, a hint, then the answer (docs/19).
export function StepLayout({ icon, title, hint, children }: StepLayoutProps) {
  useScreenBackground('grouped');
  return (
    <div className="step">
      <div className="step-head">
        <IconTile name={icon} size="hero" />
        <Title weight="1">{title}</Title>
        {hint ? <Text className="step-hint">{hint}</Text> : null}
      </div>
      {children}
    </div>
  );
}
