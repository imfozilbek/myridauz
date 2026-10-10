import { DAY_MS, tashkentDate, type Location } from '@platform/contracts';
import { useI18n } from '../../context/i18n-context';
import { useTripDays } from '../../find/use-trip-days';
import type { HomeGo } from '../../flow/start-action';
import { rememberRoute } from '../../market/recent-routes';
import type { PlaceDirectory } from '../../places/directory';
import { usePlaceNames } from '../../places/place-names';
import { MainButton, SecondaryButton } from '../../telegram/bottom-button';
import { useDockEnds } from '../dock-ends';
import { DOCK_FROM, DOCK_TO } from '../dock-sections';
import { RouteDock } from '../route-dock';
import { useHomeTap } from '../use-home-tap';

type Props = { readonly go: HomeGo; readonly directory: PlaceDirectory | null };

// The block of a free passenger (G76, mockup g76/2 states 1 and 2): «Qayerdan / Qayerga», then
// «Soʻrov qoldirish» and «Safar topish». One end is enough (owner decision 10.10.2026, docs/165):
// the search shows the directions from it, the request asks «Qayerga» first.
export function PassengerIdle({ go, directory }: Props) {
  const { t } = useI18n();
  const tap = useHomeTap();
  const ends = useDockEnds(directory);
  const { from, to } = ends;
  const names = usePlaceNames(directory);
  const find = () => {
    if (from && to) {
      rememberRoute({ from, to });
      return go('find_trip', { route: { from, to } });
    }
    return go('find_trip', from ? { from } : { pick: 'from' });
  };
  const ask = () => go('leave_request', { ...(from ? { from } : {}), ...(to ? { to } : {}) });
  return (
    <>
      <RouteDock
        from={{
          value: from ? names.from(from) : null,
          placeholder: t('way.fromEmpty'),
          ...(ends.detected ? { hint: t('home.dock.here') } : {}),
          onTap: tap('dock_from', () => go(DOCK_FROM)),
        }}
        to={{
          value: to ? names.toward(to) : null,
          placeholder: t('way.toEmpty'),
          ...(from && to ? { hint: <TripCount from={from} to={to} /> } : {}),
          onTap: tap('dock_to', () => go(DOCK_TO)),
        }}
        onSwap={tap('dock_swap', ends.swap)}
      />
      <SecondaryButton beside text={t('common.passenger.leaveRequest')} onClick={tap('dock_request', ask)} />
      <MainButton text={t('common.passenger.findTrip')} onClick={tap('main_button', find)} />
    </>
  );
}

// «Bugun 3, ertaga 8 ta safar» under the chosen «Qayerga» (mockup g76/2 state 2).
function TripCount({ from, to }: { readonly from: Location; readonly to: Location }) {
  const { t } = useI18n();
  const { value } = useTripDays({ from, to });
  if (!value) return null;
  const today = tashkentDate(Date.now());
  const tomorrow = tashkentDate(Date.now() + DAY_MS);
  const count = (date: string) => String(value.days.find((day) => day.date === date)?.trips ?? 0);
  return <>{t('home.dock.trips', { today: count(today), tomorrow: count(tomorrow) })}</>;
}
