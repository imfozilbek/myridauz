import type { RideRequest } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { OfferFlow } from '../bookings/offer-flow';
import { List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { usePending } from '../driver/driver-context';
import { RouteScreen, type Route } from '../places/route-screen';
import { EmptyState } from '../states/empty-state';
import { NotifyMe } from '../subscriptions/notify-me';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import { DateStep } from './date-step';
import { PendingLock } from './pending-lock';
import { PlacesGate } from './places-gate';
import { RequestCard, RequestScreen } from './request-card';
import { RouteView } from './route-view';
import { useList } from './use-list';
import { useDayLabel } from './when';

type FlowProps = {
  readonly onBack: () => void;
  // A bot link names the route and the day: the requests open at once (docs/83 N08).
  readonly initial?: { readonly route: Route; readonly date: string };
};

// A driver looks for passengers on a route and a day (docs/09): route, day, the requests.
export function RequestsSearchFlow({ onBack, initial }: FlowProps) {
  const [route, setRoute] = useState<Route | null>(initial?.route ?? null);
  // Back from the day, the route chosen before stays on the screen (docs/94 F8).
  const [picking, setPicking] = useState(!initial);
  const [date, setDate] = useState<string | null>(initial?.date ?? null);
  const [now] = useState(Date.now);
  const pending = usePending();
  if (pending) return <PendingLock onBack={onBack} />;
  if (picking || !route) {
    const done = (value: Route) => {
      setRoute(value);
      setPicking(false);
    };
    return (
      <RouteScreen allowWholeRegion {...(route ? { initial: route } : {})} onBack={onBack} onDone={done} />
    );
  }
  if (!date) return <DateStep now={now} onBack={() => setPicking(true)} onDone={setDate} />;
  return (
    <PlacesGate onBack={() => setDate(null)}>
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
  const { items, failed, reload, refresh } = useList(() =>
    market.searchRequests({ from: route.from.id, to: route.to.id, date }),
  );
  const [open, setOpen] = useState<RideRequest | null>(null);
  const [offering, setOffering] = useState(false);
  if (open && offering) {
    const close = () => {
      setOffering(false);
      setOpen(null);
      reload();
    };
    return <OfferFlow request={open} onBack={() => setOffering(false)} onClose={close} />;
  }
  if (open)
    return <RequestScreen request={open} onBack={() => setOpen(null)} onOffer={() => setOffering(true)} />;
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!items) return <ScreenSkeleton onBack={onBack} />;
  return (
    <div className="market">
      <Screen onBack={onBack} onRefresh={refresh} />
      <Title weight="1" className="market-title">
        {dayLabel(date, now)}
      </Title>
      <List>
        <Section footer={t('market.requests.hint')}>
          <div className="route-summary">
            <RouteView from={route.from.id} to={route.to.id} />
          </div>
        </Section>
        {items.map((request) => (
          <RequestCard key={request.id} request={request} onOpen={() => setOpen(request)} />
        ))}
      </List>
      {items.length === 0 ? (
        <EmptyState
          icon="passengers"
          title={t('market.requests.empty')}
          description={t('market.requests.emptyHint')}
          action={<NotifyMe from={route.from.id} to={route.to.id} date={date} />}
        />
      ) : null}
    </div>
  );
}
