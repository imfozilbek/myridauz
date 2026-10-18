import { GROWTH_BADGES } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { errorKey } from '../market/error-text';
import { useLoad } from '../market/use-list';
import { Screen } from '../screen/screen';
import { ActionFailure } from '../states/action-failure';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import { shareCard } from '../telegram/share-card';
import { brandVars } from '../theme/brand-vars';
import { badgeState, ImpactBadge } from './impact-badge';
import { useShareTrack } from './use-share-track';
import './impact.css';

// «Sizning taʼsiringiz» (docs/123, mockup g69/2 phone 3): who came by the person's links, who of them
// rode, the badges 1, 5 and 25; «Yana ulashish» sends the ready card «Men {brand} bilan» with the own
// link (G88, docs/193).
export function ImpactScreen({ onBack }: { readonly onBack: () => void }) {
  useScreenView('growth.impact');
  useScreenBackground();
  const { t, formatNumber } = useI18n();
  const brand = useBrand();
  const { growth } = useApiClients();
  const { value, failed, reload } = useLoad(() => growth.mine(), 'growth.mine');
  const done = useShareTrack('share-join', 'growth.impact');
  // A card that cannot be made says why, under the badges (docs/65 B3).
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  const next = GROWTH_BADGES.find((badge) => badge.people > value.joined);
  const share = async () => {
    setFailure(null);
    try {
      const card = await growth.loopCard({ loop: 'share-join' });
      if (!(await shareCard(card.prepared, card.link, card.text))) return;
      done('chat');
      haptic.success();
    } catch (caught) {
      setFailure(errorKey(caught));
    }
  };
  return (
    <div className="impact" style={brandVars(brand.theme.colors)}>
      <Screen onBack={onBack} />
      <h1 className="impact-title">{t('growth.impact.title')}</h1>
      <p className="impact-lead">{t('growth.impact.lead', { brand: brand.name })}</p>
      <div className="impact-count">
        <b>{t('growth.impact.people', { count: formatNumber(value.joined) })}</b>
        <span>{t('growth.impact.joined', { rode: formatNumber(value.rode) })}</span>
      </div>
      {GROWTH_BADGES.map((badge) => (
        <ImpactBadge
          key={badge.id}
          badge={badge}
          joined={value.joined}
          state={badgeState(badge, value.joined, next)}
        />
      ))}
      <ActionFailure error={failure} />
      <MainButton text={t('growth.impact.share')} onClick={share} />
    </div>
  );
}
