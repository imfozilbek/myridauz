import { counted } from '@platform/api-client';
import { Skeleton } from '@telegram-apps/telegram-ui';
import { useEffect } from 'react';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import { lateProps, useLateShow } from './late-show';
import './states.css';

const ROWS = 4;
const ROW_HEIGHT = 56;

// Gray placeholders while a screen loads, not a spinner over the whole screen (docs/21).
// "Back" works while it loads: a slow network never locks the person in (docs/65 B1).
// A fast answer never shows them, and the screen color is the one of the screens it stands for (G41).
// While it stands, the top loader counts it: the server or the code of the screen is on its way
// (docs/121 §3, G72).
export function ScreenSkeleton({ onBack }: { readonly onBack?: () => void }) {
  useScreenBackground();
  useEffect(() => {
    let done: () => void = () => undefined;
    void counted(() => new Promise<void>((resolve) => (done = resolve)));
    return () => done();
  }, []);
  const shown = useLateShow();
  return (
    <div {...lateProps(shown)}>
      {onBack ? <Screen onBack={onBack} /> : null}
      {Array.from({ length: ROWS }, (_, row) => (
        <Skeleton key={row} visible>
          <div style={{ height: ROW_HEIGHT }} />
        </Skeleton>
      ))}
    </div>
  );
}
