import type { RideRequest } from '@platform/contracts';
import { Text, Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { RouteScreen, type Route } from '../places/route-screen';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { BackButton } from '../telegram/back-button';
import { useScreenBackground } from '../telegram/screen-background';
import { DateStep } from './date-step';
import { PlacesGate } from './places-gate';
import { RequestCard, RequestScreen } from './request-card';
import { useList } from './use-list';
import { useDayLabel } from './when';

// A driver looks for passengers on a route and a day (docs/09): route, day, the requests.
export function RequestsSearchFlow({ onBack }: { readonly onBack: () => void }) {
  const [route, setRoute] = useState<Route | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [now] = useState(Date.now);
  if (!route) return <RouteScreen allowWholeRegion onBack={onBack} onDone={setRoute} />;
  if (!date) return <DateStep now={now} onBack={() => setRoute(null)} onDone={setDate} />;
  return (
    <PlacesGate>
      <Requests route={route} date={date} now={now} onBack={() => setDate(null)} />
    </PlacesGate>
  );
}

type RequestsProps = {
  readonly route: Route;
  readonly date: string;
  readonly now: number;
  readonly onBack: () => void;
};

function Requests({ route, date, now, onBack }: RequestsProps) {
  useScreenView('market.requests');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const { market } = useApiClients();
  const dayLabel = useDayLabel();
  const { items, failed, reload } = useList(() =>
    market.searchRequests({ from: route.from.id, to: route.to.id, date }),
  );
  const [open, setOpen] = useState<RideRequest | null>(null);
  if (open) return <RequestScreen request={open} onBack={() => setOpen(null)} />;
  if (failed) return <ErrorScreen onRetry={reload} />;
  if (!items) return <ScreenSkeleton />;
  return (
    <div className="market">
      <BackButton onClick={onBack} />
      <Title weight="1" className="market-title">{`${route.from.name} → ${route.to.name}`}</Title>
      <Text className="market-subtitle">{dayLabel(date, now)}</Text>
      {items.length === 0 ? (
        <EmptyState
          icon="passengers"
          title={t('market.requests.empty')}
          description={t('market.requests.emptyHint')}
        />
      ) : (
        <List>
          <Section>
            {items.map((request) => (
              <RequestCard key={request.id} request={request} onOpen={() => setOpen(request)} />
            ))}
          </Section>
        </List>
      )}
    </div>
  );
}
