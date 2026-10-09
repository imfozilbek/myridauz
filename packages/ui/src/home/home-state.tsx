import { useEffect } from 'react';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { haptic } from '../telegram/feedback';
import { HomeRowCard } from './home-card';
import { useHomeTap } from './use-home-tap';

// The trips did not load: what happened in plain words and one tap to try again (docs/19).
export function HomeFailed({ onRetry }: { readonly onRetry: () => void }) {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const tap = useHomeTap();
  useEffect(() => {
    haptic.error();
  }, []);
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
