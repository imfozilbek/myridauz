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

// The region name and the car plate code of each channel (brand kit data/regions.json, docs/37).
export type ChannelTitles = Readonly<Record<string, { readonly title: string; readonly code: string }>>;

// The direction of the promo video is chosen first: Toshkent → Samarqand (docs/41).
export const FIRST_ROUTE = { from: '1726', to: '1718' } as const;
