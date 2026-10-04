import { Title } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { OfferFlow } from '../bookings/offer-flow';
import { List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import type { Route } from '../places/route-screen';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { useScreenBackground } from '../telegram/screen-background';
import { DayChips } from './day-chips';
import { useDayRequests, type DayRequest } from './day-requests';
import { RequestCard, RequestScreen } from './request-card';
import { RouteView } from './route-view';
import { useDayLabel } from './when';

type Props = {
  readonly route: Route;
  readonly date: string;
  readonly now: number;
  readonly onDay: (date: string) => void;
  readonly onOtherDay: () => void;
  // The empty day: the driver puts a trip on this route and day (G37, docs/101 R4).
  readonly onPublish: () => void;
  readonly onBack: () => void;
};

// The requests of one day on a route (docs/09): the day by one tap on the screen itself, the hint
// only over requests, an empty day with one action (G37, docs/101 R2, R3, R4).
export function RequestsDay({ route, date, now, onDay, onOtherDay, onPublish, onBack }: Props) {
  useScreenView('market.requests');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const dayLabel = useDayLabel();
  const { items, failed, reload, refresh } = useDayRequests(route, date);
  const [open, setOpen] = useState<DayRequest | null>(null);
  const [offering, setOffering] = useState(false);
  if (open && offering) {
    const close = () => {
      setOffering(false);
      setOpen(null);
      reload();
    };
    return <OfferFlow request={open.request} onBack={() => setOffering(false)} onClose={close} />;
  }
  if (open)
    return (
      <RequestScreen
        request={open.request}
        onBack={() => setOpen(null)}
        {...(open.offered ? {} : { onOffer: () => setOffering(true) })}
      />
    );
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  const found = items !== null && items.length > 0;
  return (
    <div className="market">
      <Screen onBack={onBack} onRefresh={refresh} />
      <Title weight="1" className="market-title">
        {dayLabel(date, now)}
      </Title>
      <DayChips date={date} now={now} onDay={onDay} onOther={onOtherDay} />
      <List>
        <Section {...(found ? { footer: t('market.requests.hint') } : {})}>
          <div className="route-summary">
            <RouteView from={route.from.id} to={route.to.id} />
          </div>
        </Section>
        {items?.map((item) => (
          <RequestCard
            key={item.request.id}
            request={item.request}
            offered={item.offered}
            onOpen={() => setOpen(item)}
          />
        ))}
      </List>
      {items === null ? <ScreenSkeleton /> : null}
      {items?.length === 0 ? (
        <>
          <EmptyState
            icon="passengers"
            title={t('market.requests.empty')}
            description={t('market.requests.emptyHint')}
          />
          <MainButton text={t('market.requests.publish')} onClick={onPublish} />
        </>
      ) : null}
    </div>
  );
}
