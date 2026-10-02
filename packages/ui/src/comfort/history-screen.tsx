import type { HistoryItem } from '@platform/contracts';
import { Caption, Text, Title } from '@telegram-apps/telegram-ui';
import { List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { PlacesGate } from '../market/places-gate';
import { RouteView } from '../market/route-view';
import { useLoad } from '../market/use-list';
import { EmptyState } from '../states/empty-state';
import { ErrorScreen } from '../states/error-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import '../market/market.css';

// "Safarlar tarixi" (docs/18): past trips with whom and the stars both ways.
export function HistoryScreen({ onBack }: { readonly onBack: () => void }) {
  return (
    <PlacesGate onBack={onBack}>
      <History onBack={onBack} />
    </PlacesGate>
  );
}

function History({ onBack }: { readonly onBack: () => void }) {
  useScreenView('comfort.history');
  useScreenBackground('grouped');
  const { t } = useI18n();
  const { comfort } = useApiClients();
  const { value, failed, reload, refresh } = useLoad(() => comfort.history());
  if (failed) return <ErrorScreen onRetry={reload} onBack={onBack} />;
  if (!value) return <ScreenSkeleton onBack={onBack} />;
  if (value.length === 0) {
    return (
      <>
        <Screen onBack={onBack} onRefresh={refresh} />
        <EmptyState
          icon="history"
          title={t('comfort.history.empty')}
          description={t('comfort.history.emptyHint')}
        />
      </>
    );
  }
  return (
    <div className="market">
      <Screen onBack={onBack} onRefresh={refresh} />
      <Title weight="1" className="market-title">
        {t('comfort.history.title')}
      </Title>
      <List>
        {value.map((item) => (
          <PastTrip key={item.id} item={item} />
        ))}
      </List>
    </div>
  );
}

function PastTrip({ item }: { readonly item: HistoryItem }) {
  const { t, formatDate, formatMoney, formatNumber } = useI18n();
  const stars = [
    item.given === null ? null : t('comfort.history.given', { stars: formatNumber(item.given) }),
    item.received === null ? null : t('comfort.history.received', { stars: formatNumber(item.received) }),
  ].filter((line) => line !== null);
  return (
    <Section>
      <div className="trip-card">
        <div className="trip-card-head">
          <Text weight="2">{formatDate(new Date(item.departAt))}</Text>
          <Text weight="1" className="trip-price">
            {formatMoney(item.price)}
          </Text>
        </div>
        <RouteView from={item.from} to={item.to} departAt={item.departAt} km={item.km} />
        <Caption className="trip-card-hint">{item.people.join(', ')}</Caption>
        {stars.length > 0 ? <Text>{stars.join(' · ')}</Text> : null}
      </div>
    </Section>
  );
}
