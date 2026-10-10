import type { Subscription } from '@platform/contracts';
import { Text, Title } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { PlacesGate } from '../market/places-gate';
import { useLoad } from '../market/use-list';
import { ActionFailure } from '../states/action-failure';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useFailure } from '../states/use-failure';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import '../mine/mine-page.css';
import { RemovedSnackbar } from './removed-snackbar';
import { SubscriptionCard } from './subscription-card';
import '../market/market.css';

// "Obunalar" (docs/24): the routes a person waits on; renew an expired "any date", delete the rest.
// A card for each route with its bell and a red bin (G75, mockup g75/2 A).
export function SubscriptionsScreen({ onBack }: { readonly onBack: () => void }) {
  return (
    <PlacesGate onBack={onBack}>
      <Subscriptions onBack={onBack} />
    </PlacesGate>
  );
}

function Subscriptions({ onBack }: { readonly onBack: () => void }) {
  useScreenView('subscriptions');
  useScreenBackground();
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { subscriptions } = useApiClients();
  const { colors } = useBrand().theme;
  const { value, failed, reload, refresh } = useLoad(() => subscriptions.mine(), 'subscriptions');
  const [removed, setRemoved] = useState<Subscription | null>(null);
  // A renew, a removal or «Qaytarish» that did not work says why (G43, docs/65 B3).
  const failure = useFailure();
  useEffect(() => {
    track({ name: 'subscriptions_open', screen: 'subscriptions' });
  }, [track]);
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  return (
    <div className="market mine-page" style={brandVars(colors)}>
      <Screen onBack={onBack} onRefresh={refresh} />
      {removed ? (
        <RemovedSnackbar
          removed={removed}
          onClose={() => setRemoved(null)}
          onRestored={reload}
          onFailed={failure.fail}
        />
      ) : null}
      <ActionFailure error={failure.failure} />
      {value.length === 0 ? (
        <EmptyState
          icon="subscriptions"
          title={t('subscriptions.empty')}
          description={t('subscriptions.emptyHint')}
        />
      ) : (
        <>
          <Title weight="1" className="market-title">
            {t('subscriptions.title')}
          </Title>
          <Text className="market-subtitle">{t('subscriptions.hint')}</Text>
          {value.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onChange={reload}
              onAct={failure}
              onRemoved={() => setRemoved(subscription)}
            />
          ))}
        </>
      )}
    </div>
  );
}
