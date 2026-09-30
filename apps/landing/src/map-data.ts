// The map of the brand kit (docs/38): regions with SOATO codes and region centers (docs/59).
export type MapData = {
  readonly width: number;
  readonly height: number;
  readonly regions: readonly { readonly iso: string; readonly soato: string; readonly d: string }[];
  readonly cities: readonly {
    readonly id: string;
    readonly name: string;
    readonly soato: string;
    // The center place of the region: prices are counted between these places (docs/16).
    readonly place: string;
    readonly x: number;
    readonly y: number;
  }[];
};

// A pair of region SOATO codes.
export type Route = { readonly from: string; readonly to: string };

// The direction of the promo video is chosen first: Toshkent → Samarqand (docs/41).
export const FIRST_ROUTE: Route = { from: '1726', to: '1718' };

// The roads of the first screen picture in its own box (brand kit data/hero-roads.json, docs/60).
export type HeroRoads = {
  readonly box: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  readonly hub: readonly [number, number];
  readonly routes: readonly string[];
};
