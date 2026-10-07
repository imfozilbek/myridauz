import type { Location, Pitak, Point } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useEffect, useRef, useState } from 'react';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useMapView } from '../map/use-map-view';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { requestPosition } from '../telegram/location';
import { MapFailed } from './map-failed';
import { PointMap } from './point-map';
import { PointSheet } from './point-sheet';
import { rememberPlace } from './recent-places';
import { useWhere } from './use-where';
import { useClip } from './use-clip';
import { useFindMe } from './use-find-me';
import { useNameText, type PointEnd, type WayEnd } from './way-end';
import '../map/pickup-map.css';
import './way.css';

type Method = 'map' | 'search' | 'location' | 'recent' | 'saved';

type Props = {
  readonly title: TranslationKey;
  readonly start: Point;
  readonly find: (id: string) => Location | undefined;
  // A booking (G26, docs/74): the map, the search and the last places stay inside this district or
  // region; the point is checked against it.
  readonly zone?: Location;
  // A new pickup (G35, docs/97 PS12): the map moves to the person when it can.
  readonly findMe?: boolean;
  // A booking (G59, docs/126): the end it chooses, and the pitak of the trip for its start.
  readonly end?: 'from' | 'to';
  readonly pitak?: Pitak;
  readonly onPitak?: () => void;
  readonly onBack: () => void;
  readonly onPick: (end: WayEnd) => void;
};

// One point on the map (G24, docs/71; the new screen of docs/126): the search on top, the pin of the
// color of the app in the middle, «Joylashuvim» at the edge, the map of its district only. The sheet
// says what the pin points at and offers the places taken without typing.
export function PointScreen(props: Props) {
  const { title, start, find: findAny, zone, findMe = false, end, pitak, onPitak, onBack, onPick } = props;
  useScreenView('way.point');
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { map } = useApiClients();
  const { box, view, failed, retry } = useMapView(map, start);
  const find = (id: string) => {
    const found = findAny(id);
    return !zone || id === zone.id || found?.parentId === zone.id ? found : undefined;
  };
  const { where, asking } = useWhere(view);
  const nameText = useNameText();
  const [note, setNote] = useState<TranslationKey | null>(null);
  const method = useRef<Method>('map');
  const district = where?.district ?? null;
  // A new place under the pin: an old note about the last one is gone.
  useEffect(() => {
    setNote(null);
  }, [where]);
  const unclip = useClip(view, where, zone?.id ?? null);
  const moveTo = (point: Point, how: Method) => {
    method.current = how;
    setNote(null);
    unclip();
    view?.moveTo(point);
  };
  useFindMe(
    view,
    (district) => find(district) !== undefined,
    (point) => moveTo(point, 'location'),
    findMe,
  );
  const locate = async () => {
    const here = await requestPosition();
    if (here) moveTo(here, 'location');
    else setNote('way.point.noLocation');
  };
  const place = district ? find(district) : undefined;
  const outside = zone ? 'way.point.outsideZone' : 'way.point.outside';
  // A place is taken: by «Shu yerda» under the pin, or by a last place in one tap (docs/100 DS3).
  const pick = (end: PointEnd, how: Method) => {
    track({ name: 'place_point_saved', screen: 'way.point', method: how });
    rememberPlace({ point: end.point, name: end.name, district: end.place.id });
    haptic.success();
    onPick(end);
  };
  const take = () => {
    // No name yet (slow internet): wait, the point is not outside (lesson 77).
    if (!view || !where) return undefined;
    if (!place) return (haptic.error(), setNote(outside));
    return pick({ place, point: view.center(), name: where.name }, method.current);
  };
  if (failed) return <MapFailed onBack={onBack} onRetry={retry} />;
  const region = place?.parentId ? findAny(place.parentId) : undefined;
  const current = view && where && place ? { place, point: view.center(), name: where.name } : null;
  return (
    <div className="pickup-map">
      <Screen onBack={onBack} />
      <PointMap
        box={box}
        ready={view !== null}
        start={start}
        zone={zone?.id}
        note={note ? t(note, { zone: zone?.name ?? '' }) : null}
        onFound={(point) => moveTo(point, 'search')}
        onLocate={() => void locate()}
      />
      <PointSheet
        title={title}
        name={
          asking || !where
            ? null
            : place
              ? nameText(where.name, place)
              : t(outside, { zone: zone?.name ?? '' })
        }
        area={place && where?.name ? (region ? `${place.name}, ${region.name}` : place.name) : null}
        end={end ?? null}
        current={current}
        at={current?.point ?? null}
        find={find}
        onPick={(picked, how) => pick(picked, how)}
        onMove={(point) => moveTo(point, 'search')}
        {...(pitak && onPitak ? { pitak, onPitak } : {})}
      />
      {view ? (
        <MainButton
          text={t(
            end === 'from' ? 'way.point.takeFrom' : end === 'to' ? 'way.point.takeTo' : 'way.point.here',
          )}
          onClick={take}
        />
      ) : null}
    </div>
  );
}
