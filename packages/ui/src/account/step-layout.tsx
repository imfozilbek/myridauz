import { Progress, Text, Title } from '@telegram-apps/telegram-ui';
import type { ReactNode } from 'react';
import { useStepProgressValue } from '../flow/step-progress';
import { IconTile } from '../icon-tile';
import type { IconName } from '../icons';
import { useScreenBackground } from '../telegram/screen-background';
import { useOpenAtTop } from '../telegram/screen-top';

type StepLayoutProps = {
  // «Done» screens keep a big icon in the middle; a question has a small one beside its title,
  // so the answer is right under it (G40, docs/106 C2).
  readonly hero?: boolean;
  readonly icon: IconName;
  readonly title: string;
  readonly hint?: string;
  readonly children?: ReactNode;
};

// One screen, one question: an icon, a short title, a hint, then the answer (docs/19).
export function StepLayout({ hero = false, icon, title, hint, children }: StepLayoutProps) {
  useScreenBackground('grouped');
  useOpenAtTop();
  const progress = useStepProgressValue();
  return (
    <div className={hero ? 'step step-hero' : 'step'}>
      {progress === null ? null : <Progress className="step-progress" value={progress} />}
      <div className="step-head">
        <IconTile name={icon} size={hero ? 'hero' : 'cell'} />
        <Title weight="1">{title}</Title>
        {hint ? <Text className="step-hint">{hint}</Text> : null}
      </div>
      {children}
    </div>
  );
}
