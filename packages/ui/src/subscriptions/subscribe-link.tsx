import { tashkentDate } from '@platform/contracts';
import { Title } from '@telegram-apps/telegram-ui';
import { useState, type ReactNode } from 'react';
import { Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { PlacesGate } from '../market/places-gate';
import { RouteView } from '../market/route-view';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import { freshStartParam, useLinkOpened } from '../telegram/launch-param';
import { useWay } from '../mine/use-way';
import { NotifyMe } from './notify-me';
import '../market/market.css';

// "Shu yoʻnalishga obuna" under a channel post: startapp=sub_<from>_<to>_<day> (docs/15, docs/24).
const START = /^sub_(\d{2,10})_(\d{2,10})_(\d{4}-\d{2}-\d{2})$/u;
const NO_PARAMS: readonly string[] = [];
type Route = { readonly from: string; readonly to: string; readonly date: string };

function linkedRoute(): Route | null {
  const [, from, to, date] = START.exec(freshStartParam() ?? '') ?? [];
  if (!from || !to || !date) return null;
  // The day of an old post may be over: then today.
  const today = tashkentDate(Date.now());
  return { from, to, date: date < today ? today : date };
}

// The passenger app opens the route ready to subscribe; back goes to the main screen.
export function SubscribeLink({
  enabled,
  children,
}: {
  readonly enabled: boolean;
  readonly children: ReactNode;
}) {
  const [route, setRoute] = useState(() => (enabled ? linkedRoute() : null));
  useLinkOpened(route !== null, NO_PARAMS);
  if (!route) return <>{children}</>;
  return (
    <PlacesGate onBack={() => setRoute(null)}>
      <SubscribeScreen route={route} onBack={() => setRoute(null)} />
    </PlacesGate>
  );
}

function SubscribeScreen({ route, onBack }: { readonly route: Route; readonly onBack: () => void }) {
  const { t } = useI18n();
  const way = useWay();
  useScreenBackground();
  return (
    <div className="market">
      <Screen onBack={onBack} />
      <Title weight="1" className="market-title">
        {t('subscriptions.notify')}
      </Title>
      <Section>
        <div className="route-summary">
          <RouteView from={route.from} to={route.to} />
        </div>
      </Section>
      <NotifyMe from={route.from} to={route.to} date={route.date} way={way(route.from, route.to)} open />
    </div>
  );
}
