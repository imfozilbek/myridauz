import { Progress, Text, Title } from '@telegram-apps/telegram-ui';
import type { ReactNode } from 'react';
import { useStepProgressValue } from '../flow/step-progress';
import { IconTile } from '../icon-tile';
import type { IconName } from '../icons';
import { useScreenBackground } from '../telegram/screen-background';
import { useOpenAtTop } from '../telegram/screen-top';

type StepLayoutProps = {
  readonly icon: IconName;
  readonly title: string;
  readonly hint?: string;
  readonly children?: ReactNode;
};

// One screen, one question: an icon, a short title, a hint, then the answer (docs/19).
export function StepLayout({ icon, title, hint, children }: StepLayoutProps) {
  useScreenBackground('grouped');
  useOpenAtTop();
  const progress = useStepProgressValue();
  return (
    <div className="step">
      {progress === null ? null : <Progress className="step-progress" value={progress} />}
      <div className="step-head">
        <IconTile name={icon} size="hero" />
        <Title weight="1">{title}</Title>
        {hint ? <Text className="step-hint">{hint}</Text> : null}
      </div>
      {children}
    </div>
  );
}
