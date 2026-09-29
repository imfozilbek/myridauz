import type { RideRequest } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { BackButton } from '../telegram/back-button';
import { haptic } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import { PlacesGate } from './places-gate';
import { RequestCard, RequestScreen } from './request-card';
import { useList } from './use-list';
import './market.css';

// "Mening safarlarim" of a passenger: the requests (bookings come in G08); an open one can be cancelled.
export function MyRequestsScreen({ onBack }: { readonly onBack: () => void }) {
  return (
    <PlacesGate>
      <MyRequests onBack={onBack} />
    </PlacesGate>
  );
}

function MyRequests({ onBack }: { readonly onBack: () => void }) {
  useScreenView('market.my_requests');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const { market } = useApiClients();
  const { items, failed, reload } = useList(() => market.myRequests());
  const [open, setOpen] = useState<RideRequest | null>(null);
  const cancel = async (request: RideRequest) => {
    try {
      await market.cancelRequest(request.id);
      haptic.success();
    } catch {
      haptic.error();
    }
    setOpen(null);
    reload();
  };
  if (open)
    return <RequestScreen request={open} onBack={() => setOpen(null)} onCancel={() => void cancel(open)} />;
  if (failed) return <ErrorScreen onRetry={reload} />;
  if (!items) return <ScreenSkeleton />;
  if (items.length === 0) {
    return (
      <>
        <BackButton onClick={onBack} />
        <EmptyState
          icon="myTrips"
          title={t('market.mine.requestsEmpty')}
          description={t('market.mine.requestsEmptyHint')}
        />
      </>
    );
  }
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">
        {t('common.myTrips')}
      </Title>
      <List>
        <Section>
          {items.map((request) => (
            <RequestCard key={request.id} request={request} showStatus onOpen={() => setOpen(request)} />
          ))}
        </Section>
      </List>
    </div>
  );
}
