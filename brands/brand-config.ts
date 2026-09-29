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

export type BrandConfig = {
  readonly id: string;
  readonly name: string;
  readonly domain: string;
  readonly slogan: string;
  readonly monetization: 'commission';
  readonly theme: BrandTheme;
  // Photos of the 14 regions in brands/<brand>/public/regions/<SOATO code>.webp (docs/48).
  readonly regionPhotos: boolean;
  // Telegram usernames of the three bots (docs/02, docs/46): deep links between them.
  readonly bots: { readonly passenger: string; readonly driver: string; readonly admin: string };
  readonly pricing: PricingStrategy;
};
