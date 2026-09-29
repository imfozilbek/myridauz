// Everything that differs between brands (docs/22). Code reads brands only through these types.
export type HexColor = `#${string}`;

export type BrandColors = {
  readonly bg: HexColor;
  readonly bgGrouped: HexColor;
  readonly brand: HexColor;
  readonly brandStrong: HexColor;
  readonly brandText: HexColor;
  readonly brandSoft: HexColor;
  readonly brandDeep: HexColor;
  readonly brandMint: HexColor;
  readonly accent: HexColor;
  readonly accentStrong: HexColor;
  readonly accentText: HexColor;
  readonly text: HexColor;
  readonly textMuted: HexColor;
  readonly danger: HexColor;
  // Point A and point B of a route: green where the trip starts, red where it ends (docs/20).
  readonly routeFrom: HexColor;
  readonly routeTo: HexColor;
};

// Each Mini App has its own main color, so a person always knows where they are (docs/20).
export type AppName = 'passenger' | 'driver' | 'admin';

export type BrandTheme = {
  readonly colors: BrandColors;
  // What an app changes in the colors above; an app not listed uses them as they are.
  readonly apps: Readonly<Partial<Record<AppName, Partial<BrandColors>>>>;
  // Real car paint colors for the color choice (docs/04): data, not the brand.
  readonly carColors: Readonly<Record<string, HexColor>>;
  // Helper colors of illustrations and videos in the brand kit (docs/38): never in the product UI.
  readonly art: Readonly<Record<string, HexColor>>;
};

// How the recommended price is counted (docs/23): one strategy today.
type PricingStrategy = 'per-km';

// The driver's commission for a confirmed booking (docs/12): a percent of the price, per seat,
// never less than the minimum per seat. Whole sums.
export type CommissionRule = { readonly percent: number; readonly minPerSeat: number };

// The welcome bonus (docs/12, questions 27 and 28): each grant lives some days; the next one comes
// only when the previous one is spent, and only within the window after the approval.
export type PromoRule = {
  readonly amount: number;
  readonly grants: number;
  readonly days: number;
  readonly windowDays: number;
};

export type BrandConfig = {
  readonly id: string;
  readonly name: string;
  readonly domain: string;
  readonly slogan: string;
  // Model A of docs/12. A subscription (model B) comes as a new value when it is decided.
  readonly monetization: 'commission';
  readonly commission: CommissionRule;
  readonly promo: PromoRule;
  readonly theme: BrandTheme;
  // Photos of the 14 regions in brands/<brand>/public/regions/<SOATO code>.webp (docs/48).
  readonly regionPhotos: boolean;
  // Telegram usernames of the three bots (docs/02, docs/46): deep links between them.
  readonly bots: { readonly passenger: string; readonly driver: string; readonly admin: string };
  // Telegram channels by region (docs/15, docs/37): the SOATO code of the region → the channel
  // username without "@". A region without a channel (Toshkent shahri) is not listed.
  readonly channels: Readonly<Record<string, string>>;
  readonly pricing: PricingStrategy;
};
