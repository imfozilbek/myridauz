// The colors of a brand (docs/20, docs/22): the table of docs/20 and what each Mini App changes in it.
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
  // The frame of a light plate of the main color («Safar eʼlon qilindi», mockup g63/3).
  readonly brandLine: HexColor;
  readonly accent: HexColor;
  readonly accentStrong: HexColor;
  readonly accentText: HexColor;
  readonly text: HexColor;
  readonly textMuted: HexColor;
  // The second grey of a line under a title: the place of a meeting point, «Safar tugadi» (mockup g63/4).
  readonly textSecondary: HexColor;
  readonly danger: HexColor;
  // The plates of a status on the main screen (G53): done is green, waits for the person is amber.
  readonly success: HexColor;
  readonly successSoft: HexColor;
  readonly attention: HexColor;
  readonly attentionSoft: HexColor;
  // The green plate of a trip on its way: background, frame and second line (mockup g63/3).
  readonly successPale: HexColor;
  readonly successLine: HexColor;
  readonly successDeep: HexColor;
  // The tick of «{name} keldi» on the dark plate of «Uchrashuv» (mockup g63/4 screen 13).
  readonly successBright: HexColor;
  // The light background of the second color, like the tile «Soʻrov qoldirish» (G53).
  readonly accentSoft: HexColor;
  // A gray tile («Profil», G53): light background, dark icon; a face without a photo (G60).
  readonly neutralSoft: HexColor;
  readonly neutralText: HexColor;
  readonly neutralFace: HexColor;
  // A face without a photo among the passengers of the own trip (mockup g63/3).
  readonly neutralFacePale: HexColor;
  // The grey tag «Qaytarish kutilmoqda» of a past trip in «Oʻtgan»: background, words (mockup g63/5).
  readonly neutralPale: HexColor;
  readonly neutralPaleText: HexColor;
  readonly dangerText: HexColor; // a number of work waiting for the team (admin, G53)
  readonly routeFrom: HexColor; // point A of a route: green where the trip starts (docs/20)
  readonly routeTo: HexColor; // point B: red where it ends
  readonly routeLine: HexColor; // the line from A to B on the card of the own trip (mockup g63/3)
  readonly scrim: HexColor; // the shade over the screen under a sheet, at 35% (mockups g60/6, g60/7)
  // Row line, empty tick frame, inactive main button and its words (the mockups of G58, Pixel Perfect).
  readonly divider: HexColor;
  readonly control: HexColor;
  readonly disabled: HexColor;
  readonly disabledText: HexColor;
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
