import { Skeleton } from '@telegram-apps/telegram-ui';

const ROWS = 4;
const ROW_HEIGHT = 56;

// Gray placeholders while a screen loads, not a spinner over the whole screen (docs/21).
export function ScreenSkeleton() {
  return (
    <div aria-busy="true">
      {Array.from({ length: ROWS }, (_, row) => (
        <Skeleton key={row} visible>
          <div style={{ height: ROW_HEIGHT }} />
        </Skeleton>
      ))}
    </div>
  );
}
