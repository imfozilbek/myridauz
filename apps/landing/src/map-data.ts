// The map of the brand kit (docs/38): regions with SOATO codes and region centers (docs/59).
export type MapData = {
  readonly width: number;
  readonly height: number;
  readonly regions: readonly { readonly iso: string; readonly soato: string; readonly d: string }[];
  readonly cities: readonly {
    readonly id: string;
    readonly name: string;
    readonly soato: string;
    readonly x: number;
    readonly y: number;
  }[];
};

// The region names of the channels (brand kit data/regions.json, docs/37), by channel.
export type ChannelTitles = Readonly<Record<string, string>>;

// Trips start in Toshkent: the main directions lead from the capital to every region (docs/16).
export const ORIGIN = '1726';
// The direction of the promo video is chosen first: Toshkent → Samarqand (docs/41).
export const FIRST_REGION = '1718';
