import { useEffect } from 'react';
import { Cell, Section, Skeleton } from '../components';
import { useI18n } from '../context/i18n-context';
import { lateProps, useLateShow } from '../states/late-show';
import '../states/states.css';
import { IconTile, SIZES } from '../icon-tile';
import { haptic } from '../telegram/feedback';
import { useHomeTap } from './use-home-tap';

// An empty header keeps the place of the real one, so the actions below never jump.
const NO_HEADER = ' ';
const TITLE_WIDTH = '60%';
const SUBTITLE_WIDTH = '40%';
const { tile, radius } = SIZES.cell;

const bar = (width: string) => (
  <Skeleton visible>
    <span style={{ display: 'inline-block', width }}>{NO_HEADER}</span>
  </Skeleton>
);

// While the main screen loads: gray rows of the same shape as the real ones (G25).
export function HomeLoading({ lines }: { readonly lines: readonly boolean[] }) {
  const shown = useLateShow();
  return (
    <div {...lateProps(shown)}>
      <Section header={NO_HEADER}>
        {lines.map((twoLines, row) => (
          <Cell
            key={row}
            before={
              <Skeleton visible>
                <span style={{ display: 'block', width: tile, height: tile, borderRadius: radius }} />
              </Skeleton>
            }
            {...(twoLines ? { subtitle: bar(SUBTITLE_WIDTH) } : {})}
          >
            {bar(TITLE_WIDTH)}
          </Cell>
        ))}
      </Section>
    </div>
  );
}

// The trips did not load: what happened in plain words and one tap to try again (docs/19).
export function HomeFailed({ onRetry }: { readonly onRetry: () => void }) {
  const { t } = useI18n();
  const tap = useHomeTap();
  useEffect(() => haptic.error(), []);
  return (
    <div role="alert">
      <Section header={t('home.title')}>
        <Cell
          before={<IconTile name="error" tone="danger" />}
          subtitle={t('common.retry')}
          onClick={tap('retry', onRetry)}
        >
          {t('errors.generic.title')}
        </Cell>
      </Section>
    </div>
  );
}
