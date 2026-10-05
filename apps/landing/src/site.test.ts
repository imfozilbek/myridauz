import { loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { describe, expect, it } from 'vitest';
import { escape } from './html';
import { renderSite } from './site';
import { MAP, ROADS } from './test-map';

const brand = loadBrand();
const { t } = createI18n(DEFAULT_LOCALE);
const site = renderSite(brand, {
  year: 2027,
  map: MAP,
  roads: ROADS,
  script: 'run()',
});
const home = site['index.html'] ?? '';

describe('landing (G15)', () => {
  it('has the main page, the directions, the three documents and the files for search engines', () => {
    expect(Object.keys(site).sort()).toEqual([
      'consent/index.html',
      'index.html',
      'offer/index.html',
      'privacy/index.html',
      'robots.txt',
      'sitemap.xml',
      'yonalish/samarqand-toshkent/index.html',
      'yonalish/toshkent-samarqand/index.html',
    ]);
  });

  it('leads into the passenger and the driver bots of the brand', () => {
    expect(home).toContain(`href="https://t.me/${brand.bots.passenger}"`);
    expect(home).toContain(`href="https://t.me/${brand.bots.driver}"`);
    expect(home).toContain(`href="https://t.me/${brand.bots.support}"`);
    expect(home).not.toContain(brand.bots.admin);
    expect(home).toContain(escape(t('landing.cta.passenger')));
  });

  it('shows every part: pains, steps with screens, map, driver, safety, channels, questions', () => {
    for (const text of [
      'landing.pains.title',
      'landing.how.title',
      'landing.map.title',
      'landing.driver.title',
    ] as const)
      expect(home).toContain(escape(t(text)));
    expect(home).toContain('src="/art/phone-search.webp"');
    expect(home).toContain('src="/art/phone-requests.webp"');
    expect(home).toContain('data-region="1718"');
    expect(home).toContain(`href="https://t.me/${brand.bots.passenger}?startapp=find_1726_1718__site"`);
    expect(home).toContain('src="/art/hero-map.webp"');
    expect(home).toContain('<b class="code">30</b>Samarqand</a></li>');
    expect(home.match(/<details/gu)).toHaveLength(7);
    expect(home).toContain('<script>run()</script>');
  });

  it('asks the public API for prices and gives the script templates, not texts', () => {
    expect(home).toContain(`data-api="https://api.${brand.domain}/public/price"`);
    expect(home).toContain('data-money="{amount}\u00a0soʻm"');
    expect(home).toContain('data-km="≈\u00a0{km}\u00a0km"');
  });

  it('takes the name, the slogan, the domain, the numbers and the colors from the brand config', () => {
    expect(home).toContain(`<title>${escape(t('landing.title', { brand: brand.name }))}</title>`);
    expect(home).toContain(escape(brand.slogan));
    expect(home).toContain(`https://${brand.domain}/og-image.png`);
    expect(home).toContain(`--strong:${brand.theme.colors.brandStrong}`);
    expect(home).toContain(`--driver:${brand.theme.apps.driver?.brandStrong}`);
    expect(home).toContain(`${brand.commission.percent} foizi`);
    expect(home).toContain('© 2027');
  });

  it('shows each document with its edition and every section, no placeholder left', () => {
    const offer = site['offer/index.html'] ?? '';
    expect(offer).toContain(escape(t('legal.offer.title')));
    expect(offer).toContain('Tahrir 1.2');
    expect(offer).toContain(`12. ${escape(t('legal.offer.12.title'))}`);
    // Built without the requisites: the brand name; the script fills what the owner saved (G34).
    expect(offer).toContain(`<span data-company>${escape(brand.name)}</span>`);
    expect(offer).toContain(`data-legal="https://api.${brand.domain}/public/company"`);
    expect(offer).toContain('<script>run()</script>');
    for (const html of Object.values(site)) expect(html).not.toContain('{{');
    const text = (html: string) => html.replace(/data-[\w-]+="[^"]*"/gu, '');
    for (const html of Object.values(site).filter((file) => file.includes('<html')))
      expect(text(html)).not.toMatch(/(?<!\{)\{\w+\}(?!\})/u);
  });

  it('never lets a text become markup', () => {
    expect(escape('<a href="x">&\'</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
  });
});
