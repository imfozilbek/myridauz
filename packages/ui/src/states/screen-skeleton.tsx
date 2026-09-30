import { Skeleton } from '@telegram-apps/telegram-ui';
import { BackButton } from '../telegram/back-button';

const ROWS = 4;
const ROW_HEIGHT = 56;

// Gray placeholders while a screen loads, not a spinner over the whole screen (docs/21).
// "Back" works while it loads: a slow network never locks the person in (docs/65 B1).
export function ScreenSkeleton({ onBack }: { readonly onBack?: () => void }) {
  return (
    <div aria-busy="true">
      {onBack ? <BackButton onClick={onBack} /> : null}
      {Array.from({ length: ROWS }, (_, row) => (
        <Skeleton key={row} visible>
          <div style={{ height: ROW_HEIGHT }} />
        </Skeleton>
      ))}
    </div>
  );
}
