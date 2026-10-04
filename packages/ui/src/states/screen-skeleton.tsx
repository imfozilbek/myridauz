import { Skeleton } from '@telegram-apps/telegram-ui';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import { lateProps, useLateShow } from './late-show';
import './states.css';

const ROWS = 4;
const ROW_HEIGHT = 56;

// Gray placeholders while a screen loads, not a spinner over the whole screen (docs/21).
// "Back" works while it loads: a slow network never locks the person in (docs/65 B1).
// A fast answer never shows them, and the screen color is the one of the screens it stands for (G41).
export function ScreenSkeleton({ onBack }: { readonly onBack?: () => void }) {
  useScreenBackground('grouped');
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
