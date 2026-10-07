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
  // A question without its icon, as the approved screen 2 of the registration (G58).
  readonly icon?: IconName;
  // Steps of a short path drawn as segments: [this step, all steps], from 1 (G58, «2 из 2»).
  readonly steps?: readonly [number, number];
  readonly title: string;
  readonly hint?: string;
  readonly children?: ReactNode;
};

// One screen, one question: an icon, a short title, a hint, then the answer (docs/19).
export function StepLayout(props: StepLayoutProps) {
  const { hero = false, icon, steps, title, hint, children } = props;
  useScreenBackground();
  useOpenAtTop();
  const progress = useStepProgressValue();
  return (
    <div className={hero ? 'step step-hero' : 'step'}>
      {progress === null ? null : <Progress className="step-progress" value={progress} />}
      {steps ? <StepSegments at={steps[0]} of={steps[1]} /> : null}
      <div className={icon ? 'step-head' : 'step-head step-head-plain'}>
        {icon ? <IconTile name={icon} size={hero ? 'hero' : 'cell'} /> : null}
        <Title weight="1">{title}</Title>
        {hint ? <Text className="step-hint">{hint}</Text> : null}
      </div>
      {children}
    </div>
  );
}

const FULL = 100;

function StepSegments({ at, of }: { readonly at: number; readonly of: number }) {
  return (
    <div className="step-segments">
      {Array.from({ length: of }, (_, index) => (
        <Progress key={index} value={index < at ? FULL : 0} />
      ))}
    </div>
  );
}
