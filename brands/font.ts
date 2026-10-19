// The font of every screen (G73, docs/22): the theme names its folder once, the code reads it only
// through these two. The font of the phone stays behind it for the signs it has not: the emoji, rare
// letters. A folder holds regular and bold, Latin and Cyrillic, and their faces in font.css
// (brands/<brand>/brand-kit/tools/web-font.py makes them).
const PHONE_FONT =
  'system-ui,-apple-system,BlinkMacSystemFont,Roboto,"Apple Color Emoji","Helvetica Neue",sans-serif';
const FIRST_FILES = ['regular-latin', 'bold-latin'];

export const fontStack = (font: string) => `"${font}",${PHONE_FONT}`;

// The head of a page: its faces, and the Latin files asked for with the page, so the words come in
// the font at once and never jump from another one (font-display: block, G41).
export const fontHead = (font: string, faces: string) =>
  FIRST_FILES.map(
    (file) =>
      `<link rel="preload" href="/fonts/${font}/${file}.woff2" as="font" type="font/woff2" crossorigin>`,
  ).join('') + `<style>${faces}</style>`;
