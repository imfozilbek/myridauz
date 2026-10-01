import { Cell, Section, Skeleton } from '../components';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';

const ROWS = 2;
const ROW_HEIGHT = 64;

// While the trips of the main screen load: gray rows of the same height, so nothing jumps (G25).
export function HomeLoading() {
  return (
    <Section aria-busy="true">
      {Array.from({ length: ROWS }, (_, row) => (
        <Skeleton key={row} visible>
          <div style={{ height: ROW_HEIGHT }} />
        </Skeleton>
      ))}
    </Section>
  );
}

// The trips did not load: one quiet line to try again, the actions stay below.
export function HomeFailed({ onRetry }: { readonly onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <Section>
      <Cell before={<IconTile name="error" tone="accent" />} onClick={onRetry}>
        {t('common.retry')}
      </Cell>
    </Section>
  );
}
