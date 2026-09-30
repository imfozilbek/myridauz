import { loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { describe, expect, it } from 'vitest';
import { directions } from './directions';
import { escape } from './html';
import { renderSite } from './site';
import { MAP, ROADS } from './test-map';

const brand = loadBrand();
const { t } = createI18n(DEFAULT_LOCALE);
const site = renderSite(brand, { year: 2027, map: MAP, roads: ROADS, script: 'run()' });
const page = site['yonalish/samarqand-toshkent/index.html'] ?? '';
const values = { from: 'Samarqand', to: 'Toshkent', brand: brand.name };
const jsonLd = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gu)].map(
    ([, data]) => JSON.parse(data ?? '{}') as { '@type': string; mainEntity?: unknown[] },
  );

describe('directions for search engines (docs/60)', () => {
  it('goes from the capital to every region center and back', () => {
    expect(directions(MAP).map((item) => item.path)).toEqual([
      '/yonalish/toshkent-samarqand/',
      '/yonalish/samarqand-toshkent/',
    ]);
    expect(directions({ ...MAP, cities: [] })).toEqual([]);
  });

  it('shows the chosen route on the map and opens the bot with it', () => {
    expect(page).toContain(`<title>${escape(t('landing.direction.meta', values))}</title>`);
    expect(page).toContain(`<h1>${escape(t('landing.direction.title', values))}</h1>`);
    expect(page).toContain(`content="${escape(t('landing.direction.description', values))}"`);
    expect(page).toContain(`href="https://t.me/${brand.bots.passenger}?startapp=find_1718_1726"`);
    expect(page).toContain('<option value="1718" data-place="1718401"');
    expect(page).toContain('class="region from" d="M60 40L66 40L66 46Z" data-region="1718"');
    expect(page).toContain(
      `<link rel="canonical" href="https://${brand.domain}/yonalish/samarqand-toshkent/">`,
    );
    expect(page).toContain('aria-current="page">Samarqand');
    expect(page).toContain('<script>run()</script>');
  });

  it('describes the pages in structured data: the brand, the questions, the path', () => {
    const home = jsonLd(site['index.html'] ?? '');
    expect(home.map((item) => item['@type'])).toEqual(['Organization', 'WebSite', 'FAQPage']);
    expect(home[2]?.mainEntity).toHaveLength(7);
    const own = jsonLd(page);
    expect(own.map((item) => item['@type'])).toEqual(['FAQPage', 'BreadcrumbList']);
    expect(JSON.stringify(own[0])).toContain(t('landing.direction.faq.price.q', values));
    expect(page.match(/<details/gu)).toHaveLength(6);
  });

  it('lists every page in the sitemap and points to it from robots.txt', () => {
    const sitemap = site['sitemap.xml'] ?? '';
    for (const path of ['/', '/yonalish/toshkent-samarqand/', '/offer/'])
      expect(sitemap).toContain(`<loc>https://${brand.domain}${path}</loc>`);
    expect(site['robots.txt']).toContain(`Sitemap: https://${brand.domain}/sitemap.xml`);
  });
});
