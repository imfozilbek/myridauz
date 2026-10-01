import { Text, Title } from '@telegram-apps/telegram-ui';
import { useEffect, type ReactNode } from 'react';
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
// It opens at the top: the question is never left above the screen by the scroll of the last one (G27).
export function StepLayout({ icon, title, hint, children }: StepLayoutProps) {
  useScreenBackground('grouped');
  useEffect(() => window.scrollTo(0, 0), []);
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
