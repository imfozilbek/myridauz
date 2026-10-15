import { TASHKENT_CITY, WAITLIST_REGIONS } from '@platform/contracts';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import type { PlaceDirectory } from '../places/directory';
import { WaitlistSteps, WaitlistTitle } from './parts';
import { UzMap } from './uz-map';

type Props = {
  // home: «Qaysi viloyatdansiz?»; city: «Qaysi viloyatga qatnaysiz?» of a person of Toshkent shahri.
  readonly kind: 'home' | 'city';
  readonly chosen: string | null;
  readonly directory: PlaceDirectory;
  readonly onPick: (region: string) => void;
};

// One question, one tap (owner decision 14.10.2026, mockup 5-regions): the map and the 14 regions in
// two columns, whole names, no scroll; the route is Toshkent shahri and the region, both ways.
export function RegionStep({ kind, chosen, directory, onPick }: Props) {
  useScreenView(`waitlist_${kind}`);
  const { t } = useI18n();
  const regions =
    kind === 'city' ? WAITLIST_REGIONS.filter((region) => region !== TASHKENT_CITY) : WAITLIST_REGIONS;
  return (
    <>
      <WaitlistSteps at={2} />
      <WaitlistTitle title={t(`waitlist.${kind}.title`)} hint={t(`waitlist.${kind}.hint`)} />
      <div className="wl-map-card">
        <UzMap chosen={chosen} onPick={(region) => regions.includes(region) && onPick(region)} />
      </div>
      <div className="wl-regions">
        {regions.map((region) => (
          <button
            key={region}
            type="button"
            className={region === chosen ? 'wl-region wl-region-on' : 'wl-region'}
            aria-pressed={region === chosen}
            onClick={() => onPick(region)}
          >
            {directory.find(region)?.name ?? region}
          </button>
        ))}
      </div>
    </>
  );
}
