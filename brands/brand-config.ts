// Everything that differs between brands (docs/22). Code reads brands only through this type.
export type BrandTheme = {
  readonly brand: string;
  readonly accent: string;
};

export type BrandConfig = {
  readonly id: string;
  readonly name: string;
  readonly domain: string;
  readonly slogan: string;
  readonly monetization: 'commission';
  readonly theme: BrandTheme;
};
