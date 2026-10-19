import type { BrandConfig } from '@platform/brands';

// The splash of docs/121 §4: drawn by index.html itself, with no script, so it is there from the first
// frame and nothing white blinks before it. The build puts it in (packages/config/vite.config.js).
export const SPLASH_ID = 'splash';
export const SPLASH_STYLE_ID = 'splash-style';

// One logo for every brand: the square and the letter of brands/<brand>/public/logo.svg.
const VIEW_BOX = /viewBox="([^"]+)"/;
const CORNER = /<rect[^>]*\srx="([^"]+)"/;
const LETTER = /<path[^>]*\sd="([^"]+)"/;
const ESCAPES: Readonly<Record<string, string>> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const escape = (text: string) => text.replace(/[&<>"]/g, (sign) => ESCAPES[sign] ?? sign);

function pick(svg: string, pattern: RegExp): string {
  const found = pattern.exec(svg)?.[1];
  if (found === undefined) throw new Error('splash.logo_unreadable');
  return found;
}

export type SplashParts = { readonly head: string; readonly body: string };

// The brand comes as one Mini App sees it (brandForApp): the page and the letter in its main color, the
// square and the words white (docs/20, docs/36).
export function splashHtml(brand: BrandConfig, logoSvg: string, css: string): SplashParts {
  const { brandStrong: color, bg: white } = brand.theme.colors;
  const [viewBox, corner, letter] = [VIEW_BOX, CORNER, LETTER].map((pattern) => pick(logoSvg, pattern));
  const logo =
    `<svg class="splash-logo" viewBox="${viewBox}" aria-hidden="true">` +
    `<rect width="100%" height="100%" rx="${corner}" fill="${white}"/><path d="${letter}" fill="${color}"/></svg>`;
  const head =
    `<style id="${SPLASH_STYLE_ID}">html{background:${color}}` +
    `#${SPLASH_ID}{--splash:${color};--splash-ink:${white}}${css}</style>`;
  const body =
    `<div id="${SPLASH_ID}" class="splash" aria-hidden="true"><div class="splash-loader"></div>` +
    `<div class="splash-mark">${logo}<b class="splash-name">${escape(brand.name)}</b>` +
    `<span class="splash-slogan">${escape(brand.slogan)}</span></div></div>`;
  return { head, body };
}
