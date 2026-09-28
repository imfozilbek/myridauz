// Everything that differs between brands (docs/22). Code reads brands only through these types.
export type HexColor = `#${string}`;

export type BrandColors = {
  readonly bg: HexColor;
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

export type BrandTheme = {
  readonly colors: BrandColors;
};

export type BrandConfig = {
  readonly id: string;
  readonly name: string;
  readonly domain: string;
  readonly slogan: string;
  readonly monetization: 'commission';
  readonly theme: BrandTheme;
};
