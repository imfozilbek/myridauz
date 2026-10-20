import type { Location } from '@platform/contracts';
import { useApiClients } from '../../context/api-clients';
import { useI18n } from '../../context/i18n-context';
import { usePending } from '../../driver/driver-context';
import type { HomeGo } from '../../flow/start-action';
import { useLoad } from '../../market/use-list';
import type { PlaceDirectory } from '../../places/directory';
import { usePlaceNames } from '../../places/place-names';
import { MainButton, SecondaryButton } from '../../telegram/bottom-button';
import { DOCK_FROM, DOCK_TO } from '../dock-sections';
import { RouteDock } from '../route-dock';
import { useDriverLaunch } from './driver-launch';
import { useEndTools } from './end-tools';
import { useHomeTap } from '../use-home-tap';

type Props = { readonly go: HomeGo; readonly directory: PlaceDirectory | null };

// The block of a free driver (G76, mockup g76/3 states 2 and 5): «Qayerdan / Qayerga», then
// «Soʻrovlarni koʻrish» and «Safar eʼlon qilish». One end is enough (docs/165): the requests from
// it to every side, a new trip asking the other end first; the «x» of an end empties it, an empty
// «Qayerdan» is filled where the person stands by «Joylashuvim» (G79 В4).
// While the application is checked, both wait.
export function DriverIdle({ go, directory }: Props) {
  const { t } = useI18n();
  const tap = useHomeTap();
  const pending = usePending();
  const names = usePlaceNames(directory);
  const { ends, publish, requests } = useDriverLaunch(go, directory);
  const tools = useEndTools(ends, go);
  const { from, to } = ends;
  return (
    <>
      <RouteDock
        from={{
          value: from ? names.end(from) : null,
          placeholder: t('way.fromEmpty'),
          ...(ends.detected ? { hint: t('home.dock.here') } : {}),
          onTap: tap('dock_from', () => go(DOCK_FROM)),
          ...tools.from,
        }}
        to={{
          value: to ? names.end(to) : null,
          placeholder: t('home.dock.toDriver'),
          ...(from && to && !pending
            ? { hint: <RequestCount key={`${from.id}-${to.id}`} from={from} to={to} /> }
            : {}),
          onTap: tap('dock_to', () => go(DOCK_TO)),
          ...tools.to,
        }}
        onSwap={tap('dock_swap', ends.swap)}
      />
      {pending ? <p className="home-dock-note">{t('home.dock.afterCheckLong')}</p> : null}
      <SecondaryButton
        beside
        text={t('home.dock.requestsSee')}
        disabled={pending}
        onClick={tap('dock_requests', requests)}
      />
      <MainButton text={t('home.publish')} disabled={pending} onClick={tap('main_button', publish)} />
    </>
  );
}

// «Yoʻnalishingizda 5 ta» under the chosen «Qayerga»: the requests of passengers on this way
// (mockup g76/3 state 5).
function RequestCount({ from, to }: { readonly from: Location; readonly to: Location }) {
  const { t } = useI18n();
  const { market } = useApiClients();
  const { value } = useLoad(() => market.requestBoard({ from: from.id, to: to.id }));
  if (!value?.known) return null;
  const count = value.days.reduce((sum, day) => sum + day.count, 0);
  return <>{t('home.dock.near', { count: String(count) })}</>;
}
