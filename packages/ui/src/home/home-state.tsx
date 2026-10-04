import { useEffect } from 'react';
import { Skeleton } from '../components';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { lateProps, useLateShow } from '../states/late-show';
import '../states/states.css';
import { haptic } from '../telegram/feedback';
import { HomeCard, HomeRowCard } from './home-card';
import { useHomeTap } from './use-home-tap';

// A gray bar keeps the place of a line, so the tiles below never jump.
const NO_TEXT = ' ';
const TITLE_WIDTH = '60%';
const SUBTITLE_WIDTH = '40%';

const bar = (width: string) => (
  <Skeleton visible>
    <span style={{ display: 'inline-block', width }}>{NO_TEXT}</span>
  </Skeleton>
);

// While the main screen loads: gray cards of the same shape as the real ones (G25, G53).
export function HomeLoading({ lines }: { readonly lines: readonly boolean[] }) {
  const shown = useLateShow();
  return (
    <div {...lateProps(shown)}>
      <div className="home-stack-part">
        {lines.map((twoLines, row) => (
          <HomeCard key={row}>
            <span className="home-card-title">{bar(TITLE_WIDTH)}</span>
            {twoLines ? <span className="home-card-hint">{bar(SUBTITLE_WIDTH)}</span> : null}
          </HomeCard>
        ))}
      </div>
    </div>
  );
}

// The trips did not load: what happened in plain words and one tap to try again (docs/19).
export function HomeFailed({ onRetry }: { readonly onRetry: () => void }) {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const tap = useHomeTap();
  useEffect(() => haptic.error(), []);
  return (
    <div role="alert" className="home-stack-part">
      <HomeRowCard
        icon="error"
        color={colors.danger}
        title={t('errors.generic.title')}
        hint={t('common.retry')}
        onClick={tap('retry', onRetry)}
      />
    </div>
  );
}
