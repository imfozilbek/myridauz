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
  // The big tile of a state screen: a block, an empty list, an error (G75, mockup g75/1 A).
  readonly stateTile: HexColor;
  readonly dangerTile: HexColor;
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
  // The frame of an offer inside a talk, on both sides (G64, mockups g64/4, g64/5).
  readonly attentionLine: HexColor;
  // The words of the wallet warning before a deletion (G75, mockup g75/5 A).
  readonly attentionInk: HexColor;
  // «Bu raqam yana 1 arizada bor» on the application of a case (G75, mockup g67/2 screen 3).
  readonly warning: HexColor;
  readonly warningText: HexColor;
  readonly warningSoft: HexColor;
  readonly warningLine: HexColor;
  // The green plate of a trip on its way: background, frame and second line (mockup g63/3).
  readonly successPale: HexColor;
  readonly successLine: HexColor;
  readonly successDeep: HexColor;
  // The tick of «{name} keldi» on the dark plate of «Uchrashuv» (mockup g63/4 screen 13).
  readonly successBright: HexColor;
  // The light background of the second color, like the tile «Soʻrov qoldirish» (G53).
  readonly accentSoft: HexColor;
  // The words under «Haydovchi boʻling» on the amber row of the main screen (mockup g66/1).
  readonly accentDeep: HexColor;
  // The line around the card of the trip on the main screen (mockups g66/1, g66/2).
  readonly cardLine: HexColor;
  // The number on a tile and ⇅ of «Qayerdan / Qayerga»: the same in every app (mockups g66/1, g66/2).
  readonly badge: HexColor;
  readonly routeSwap: HexColor;
  // The amber of a thing coming soon in both apps: «Hozir: …» over the block (G76, mockup g76).
  readonly soon: HexColor;
  // A gray tile («Profil», G53): light background, dark icon; a face without a photo (G60).
  readonly neutralSoft: HexColor;
  readonly neutralText: HexColor;
  // The dark of our camera around its frame (G75, mockup g75/6 A).
  readonly neutralNight: HexColor;
  readonly neutralFace: HexColor;
  // A face without a photo among the passengers of the own trip (mockup g63/3).
  readonly neutralFacePale: HexColor;
  // The grey tag «Qaytarish kutilmoqda» of a past trip in «Oʻtgan»: background, words (mockup g63/5).
  readonly neutralPale: HexColor;
  readonly neutralPaleText: HexColor;
  readonly dangerText: HexColor; // a number of work waiting for the team (admin, G53)
  // «Hamyon» for fewer than 5 seats on the main screen: light red, a red line (mockup g66/2).
  readonly dangerSoft: HexColor;
  readonly dangerLine: HexColor;
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
