import { useState } from 'react';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useSchedule } from './use-schedule';
import { WhenStep } from './when-step';

type Props = {
  readonly from: string;
  readonly to: string;
  readonly fixedDate?: string;
  readonly initial?: { readonly date: string; readonly time?: string };
  readonly onBack: () => void;
  readonly onDone: (when: { date: string; time: string; departAt: number }) => void;
};

// The day and the time of a new trip with the driver's busy times of this route (docs/103).
export function TripWhen({ from, to, ...props }: Props) {
  const [now] = useState(Date.now);
  const schedule = useSchedule(from, to);
  if (!schedule) return <ScreenSkeleton onBack={props.onBack} />;
  return <WhenStep now={now} schedule={schedule} {...props} />;
}
