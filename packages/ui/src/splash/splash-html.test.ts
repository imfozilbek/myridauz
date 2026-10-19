import { brandForApp, loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import { splashHtml } from './splash-html';

const LOGO =
  '<svg viewBox="0 0 64 64"><rect x="0" y="0" width="64" height="64" rx="14.08"/>' +
  '<path d="M1 1L2 2Z"/></svg>';
const brand = loadBrand();

// The splash of index.html (docs/121 §4): the color of the Mini App, the logo, the name and the slogan
// of the brand, no button.
describe('splashHtml (G72)', () => {
  it.each(['passenger', 'driver', 'admin'] as const)('paints the %s app in its own color', (app) => {
    const colors = brandForApp(brand, app).theme.colors;
    const { head, body } = splashHtml(brandForApp(brand, app), LOGO, '.splash{}');
    expect(head).toContain(`html{background:${colors.brandStrong}}`);
    expect(head).toContain('.splash{}');
    expect(body).toContain(`<path d="M1 1L2 2Z" fill="${colors.brandStrong}"/>`);
    expect(body).toContain(`rx="14.08" fill="${colors.bg}"`);
  });

  it('takes the name and the slogan from the brand, with no button and no script', () => {
    const { body } = splashHtml(brand, LOGO, '');
    expect(body).toContain(`>${brand.name}</b>`);
    expect(body).toContain(`>${brand.slogan}</span>`);
    expect(body).not.toMatch(/<button|<script/);
  });

  it('keeps the words of a brand as text', () => {
    const { body } = splashHtml({ ...brand, name: 'A<b>' }, LOGO, '');
    expect(body).toContain('A&lt;b&gt;');
  });

  it('refuses a logo it cannot read', () => {
    expect(() => splashHtml(brand, '<svg/>', '')).toThrow('splash.logo_unreadable');
  });
});
