import { MAP_GROUPS, REGION_GROUPS, TASHKENT_CITY, type MapGroup } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import map from './region-map.json';

type Point = readonly [number, number];
// The points of the drawing are pairs x, y in the box of the map.
const pointOf = (value: readonly number[] | undefined): Point | undefined =>
  value ? [value[0] ?? 0, value[1] ?? 0] : undefined;
const centers: Readonly<Record<string, readonly number[]>> = map.centers;
const spots: Readonly<Record<string, readonly number[]>> = map.spots;
const groups: Readonly<Record<MapGroup, readonly number[]>> = map.groups;
const [cityX, cityY] = pointOf(map.city) ?? [0, 0];
// The groups that touch never share a tint (mockup 5-regions): Toshkent, then Vodiy and Markaz, then
// Janub and Gʻarb.
const SHADE: Readonly<Record<MapGroup, 'mapTint' | 'mapTintPale' | 'mapTintMid'>> = {
  tashkent: 'mapTint',
  valley: 'mapTintPale',
  center: 'mapTintPale',
  south: 'mapTintMid',
  west: 'mapTintMid',
};
const groupOf = (region: string) =>
  MAP_GROUPS.find((group) => (REGION_GROUPS[group] as readonly string[]).includes(region));
const FONT = 11.5;
const LABEL = { fontSize: FONT, paintOrder: 'stroke', strokeLinejoin: 'round', strokeWidth: 3 } as const;
const DOT = 9;

type Props = { readonly chosen: string | null; readonly onPick: (region: string) => void };

// The map of the regions (G83, docs/181): an own drawing from the borders of the directory, no map
// library; a tap on a region is the same as its button. The chosen region in the strong color with
// its name, a line from Toshkent shahri to it. Only the map gets smaller on a low screen (docs/121).
export function UzMap({ chosen, onPick }: Props) {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const fill = (region: string) => {
    const group = groupOf(region);
    return region === chosen ? colors.brandStrong : group ? colors[SHADE[group]] : colors.mapLand;
  };
  const end = chosen ? pointOf(centers[chosen]) : undefined;
  const spot = chosen ? pointOf(spots[chosen]) : undefined;
  const label = (key: TranslationKey, [x, y]: Point, bold: boolean) => (
    <text
      key={key}
      x={x}
      y={y}
      textAnchor="middle"
      fontWeight={bold ? 800 : 700}
      fill={bold ? colors.bg : colors.mapInk}
      stroke={bold ? colors.brandStrong : colors.bg}
      style={LABEL}
    >
      {t(key)}
    </text>
  );
  return (
    <svg
      className="wl-map"
      viewBox={`0 0 ${map.width} ${map.height}`}
      role="img"
      aria-label={t('waitlist.route')}
    >
      <rect width={map.width} height={map.height} fill={colors.mapLand} />
      {Object.entries(map.regions).map(([region, d]) => (
        <path
          key={`${region}-edge`}
          d={d}
          fill={fill(region)}
          stroke={colors.bg}
          strokeWidth={2.4}
          strokeLinejoin="round"
        />
      ))}
      {Object.entries(map.regions).map(([region, d]) => (
        <path
          key={region}
          d={d}
          fill={fill(region)}
          stroke={fill(region)}
          strokeWidth={0.8}
          onClick={() => onPick(region)}
        />
      ))}
      {end && chosen !== TASHKENT_CITY ? (
        <>
          <line
            x1={cityX}
            y1={cityY}
            x2={end[0]}
            y2={end[1]}
            stroke={colors.bg}
            strokeWidth={6}
            strokeLinecap="round"
          />
          <line
            x1={cityX}
            y1={cityY}
            x2={end[0]}
            y2={end[1]}
            stroke={colors.brandStrong}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </>
      ) : null}
      {MAP_GROUPS.filter((group) => !chosen || groupOf(chosen) !== group).map((group) =>
        label(`waitlist.group.${group}`, pointOf(groups[group]) ?? [0, 0], false),
      )}
      {chosen && spot ? label(`waitlist.map.${chosen}` as TranslationKey, spot, true) : null}
      {end && chosen !== TASHKENT_CITY ? (
        <circle cx={cityX} cy={cityY} r={DOT} fill={colors.routeFrom} stroke={colors.bg} strokeWidth={3} />
      ) : null}
    </svg>
  );
}
