export const C = {
  teal: '#0D9488', deep: '#115E59', tealText: '#0F766E', tealSoft: '#F0FDFA', mint: '#CCFBF1',
  amber: '#F59E0B', amberStrong: '#D97706', amberSoft: '#FEF3C7',
  white: '#FFFFFF', ink: '#1F2937', muted: '#6B7280'
};
// Six logo combos (docs/36): background and R color.
export const COMBOS = {
  1: { bg: C.teal, fg: C.white }, 2: { bg: C.white, fg: C.teal }, 3: { bg: C.amberStrong, fg: C.white },
  4: { bg: C.white, fg: C.amberStrong }, 5: { bg: C.deep, fg: C.amber }, 6: { bg: C.amber, fg: C.deep }
};
export const svg = (w, h, body, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"${extra}>${body}</svg>`;
