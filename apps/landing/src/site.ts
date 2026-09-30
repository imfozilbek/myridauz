import type { BrandConfig } from '@platform/brands';
import { LEGAL_DOCUMENTS } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE, legalTitle } from '@platform/i18n';
import { documentPage } from './document';
import { home } from './home';
import type { ChannelTitles, MapData } from './map-data';
import { page } from './page';

// Every page of the landing, by its file in dist: the main page and the three documents.
// The map and the script come from the build (prerender.ts), so rendering stays a pure function.
export function renderSite(
  brand: BrandConfig,
  { year, map, channels, script }: { year: number; map: MapData; channels: ChannelTitles; script: string },
): Record<string, string> {
  const i18n = createI18n(DEFAULT_LOCALE);
  const pages: Record<string, string> = {
    'index.html': page({
      brand,
      i18n,
      year,
      title: i18n.t('landing.title', { brand: brand.name }),
      path: '/',
      body: home(brand, i18n, map, channels),
      script,
    }),
  };
  for (const document of LEGAL_DOCUMENTS) {
    pages[`${document}/index.html`] = page({
      brand,
      i18n,
      year,
      title: `${i18n.t(legalTitle(document))}: ${brand.name}`,
      path: `/${document}/`,
      body: documentPage(document, brand, i18n),
    });
  }
  return pages;
}
