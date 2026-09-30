import { loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { describe, expect, it } from 'vitest';
import { escape } from './html';
import { renderSite } from './site';

const brand = loadBrand();
const { t } = createI18n(DEFAULT_LOCALE);
const site = renderSite(brand, 2027);
const home = site['index.html'] ?? '';

describe('landing (G15)', () => {
  it('has the main page and the three documents', () => {
    expect(Object.keys(site).sort()).toEqual([
      'consent/index.html',
      'index.html',
      'offer/index.html',
      'privacy/index.html',
    ]);
  });

  it('leads into the passenger and the driver bots of the brand', () => {
    expect(home).toContain(`href="https://t.me/${brand.bots.passenger}"`);
    expect(home).toContain(`href="https://t.me/${brand.bots.driver}"`);
    expect(home).toContain(`href="https://t.me/${brand.bots.admin}"`);
    expect(home).toContain(escape(t('landing.cta.passenger')));
    expect(home).toContain(escape(t('landing.safety.woman.title')));
  });

  it('takes the name, the slogan, the domain and the colors from the brand config', () => {
    expect(home).toContain(`<title>${escape(t('landing.title', { brand: brand.name }))}</title>`);
    expect(home).toContain(escape(brand.slogan));
    expect(home).toContain(`https://${brand.domain}/og-image.png`);
    expect(home).toContain(`--strong:${brand.theme.colors.brandStrong}`);
    expect(home).toContain(`--driver:${brand.theme.apps.driver?.brandStrong}`);
    expect(home).toContain('© 2027');
  });

  it('shows each document with its edition and every section, no placeholder left', () => {
    const offer = site['offer/index.html'] ?? '';
    expect(offer).toContain(escape(t('legal.offer.title')));
    expect(offer).toContain('Tahrir 1.0');
    expect(offer).toContain(`12. ${escape(t('legal.offer.12.title'))}`);
    for (const html of Object.values(site)) expect(html).not.toMatch(/(?<!\{)\{\w+\}(?!\})/u);
  });

  it('never lets a text become markup', () => {
    expect(escape('<a href="x">&\'</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
  });
});
