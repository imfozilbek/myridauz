// The map of the Mini App (G22, docs/67): one PMTiles archive of Uzbekistan from OpenStreetMap and
// the fonts of its labels, both in R2 and served by the API. A new archive gets a new name.
export const MAP_PATH = '/map';
export const MAP_ARCHIVE = 'uzbekistan-20260331.pmtiles';
export const MAP_FONTS_PATH = `${MAP_PATH}/fonts`;
export const MAP_FONTS = ['Noto Sans Regular', 'Noto Sans Medium', 'Noto Sans Italic'] as const;
