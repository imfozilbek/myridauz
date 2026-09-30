import type { BrandConfig } from '@platform/brands';
import { LEGAL_DOCUMENTS } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE, legalTitle } from '@platform/i18n';
import { directionPage, directionQuestions } from './direction-page';
import { directions } from './directions';
import { documentPage } from './document';
import { home } from './home';
import type { HeroRoads, MapData } from './map-data';
import { page } from './page';
import { searchFiles } from './search-files';
import { questions } from './sections/faq';
import { breadcrumbs, faqPage, organization } from './structured-data';

type Build = { year: number; map: MapData; roads: HeroRoads; script: string };

// Every file of the landing in dist: the main page, a page of every direction (docs/60),
// the three documents and the files for search engines.
// The map and the script come from the build (prerender.ts), so rendering stays a pure function.
export function renderSite(brand: BrandConfig, { year, map, roads, script }: Build): Record<string, string> {
  const i18n = createI18n(DEFAULT_LOCALE);
  const { t } = i18n;
  const all = directions(map);
  const items = questions(brand, i18n);
  const pages: Record<string, string> = {
    'index.html': page({
      brand,
      i18n,
      year,
      title: t('landing.title', { brand: brand.name }),
      path: '/',
      body: home(brand, i18n, { map, roads, all, items }),
      head: organization(brand, t('landing.description', { brand: brand.name })) + faqPage(items),
      script,
    }),
  };
  for (const current of all) {
    const values = { from: current.from.name, to: current.to.name, brand: brand.name };
    const own = directionQuestions(brand, i18n, current);
    const trail = [
      { name: t('landing.document.home'), path: '/' },
      { name: t('landing.direction.title', values), path: current.path },
    ];
    pages[`${current.path.slice(1)}index.html`] = page({
      brand,
      i18n,
      year,
      title: t('landing.direction.meta', values),
      description: t('landing.direction.description', values),
      path: current.path,
      body: directionPage(brand, i18n, { map, all, current, items: own }),
      head: faqPage(own) + breadcrumbs(brand, trail),
      script,
    });
  }
  for (const document of LEGAL_DOCUMENTS) {
    pages[`${document}/index.html`] = page({
      brand,
      i18n,
      year,
      title: `${t(legalTitle(document))}: ${brand.name}`,
      path: `/${document}/`,
      body: documentPage(document, brand, i18n),
    });
  }
  const paths = ['/', ...all.map((item) => item.path), ...LEGAL_DOCUMENTS.map((document) => `/${document}/`)];
  return { ...pages, ...searchFiles(brand, paths) };
}
