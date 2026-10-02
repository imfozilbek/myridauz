import type { Subscription } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { Cell, List, Section } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { DangerCell } from '../danger-cell';
import { IconTile } from '../icon-tile';
import { FactChips, type Fact } from '../market/fact-chips';
import { PlacesGate } from '../market/places-gate';
import { RouteView } from '../market/route-view';
import { useLoad } from '../market/use-list';
import { noonOf } from '../market/when';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { Screen } from '../screen/screen';
import { confirm, haptic } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import { RemovedSnackbar } from './removed-snackbar';
import '../market/market.css';

// "Obunalar" (docs/24): the routes a person waits on; renew an expired "any date", delete the rest.
export function SubscriptionsScreen({ onBack }: { readonly onBack: () => void }) {
  return (
    <PlacesGate onBack={onBack}>
      <Subscriptions onBack={onBack} />
    </PlacesGate>
  );
}

function Subscriptions({ onBack }: { readonly onBack: () => void }) {
  useScreenView('subscriptions');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { subscriptions } = useApiClients();
  const { value, failed, reload, refresh } = useLoad(() => subscriptions.mine());
  const [removed, setRemoved] = useState<Subscription | null>(null);
  useEffect(() => track({ name: 'subscriptions_open', screen: 'subscriptions' }), [track]);
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  return (
    <div className="market">
      <Screen onBack={onBack} onRefresh={refresh} />
      {removed ? (
        <RemovedSnackbar removed={removed} onClose={() => setRemoved(null)} onRestored={reload} />
      ) : null}
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
          <List>
            {value.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                onChange={reload}
                onRemoved={() => setRemoved(subscription)}
              />
            ))}
          </List>
        </>
      )}
    </div>
  );
}

type CardProps = {
  readonly subscription: Subscription;
  readonly onChange: () => void;
  readonly onRemoved: () => void;
};

function SubscriptionCard({ subscription, onChange, onRemoved }: CardProps) {
  const { t, formatDate } = useI18n();
  const { subscriptions } = useApiClients();
  const [busy, setBusy] = useState(false);
  const { date, woman, expired, expiresAt } = subscription;
  const facts: readonly Fact[] = [
    date === null
      ? ['subscriptions', t('subscriptions.anyUntil', { date: formatDate(new Date(expiresAt)) })]
      : ['subscriptions', formatDate(noonOf(date))],
    ...(woman ? [['passengers', t('subscriptions.woman')] as const] : []),
    ...(expired ? [['blocked', t('subscriptions.expired')] as const] : []),
  ];
  const act = async (action: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      haptic.success();
    } catch {
      haptic.error();
    }
    setBusy(false);
    onChange();
  };
  // Asked first in the native window; then a short line can bring it back (docs/88 L7, L8).
  const remove = async () => {
    if (!(await confirm(t('subscriptions.removeAsk'), t('subscriptions.remove')))) return;
    await act(async () => {
      await subscriptions.remove(subscription.id);
      onRemoved();
    });
  };
  return (
    <Section>
      <div className="route-summary">
        <RouteView from={subscription.from} to={subscription.to} />
        <FactChips facts={facts} />
      </div>
      {expired ? (
        <Cell
          before={<IconTile name="subscriptions" />}
          onClick={() => void act(() => subscriptions.renew(subscription.id))}
        >
          {t('subscriptions.renew')}
        </Cell>
      ) : null}
      <DangerCell icon="blocked" onClick={() => void remove()}>
        {t('subscriptions.remove')}
      </DangerCell>
    </Section>
  );
}
