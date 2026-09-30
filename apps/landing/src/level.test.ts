// @vitest-environment jsdom
import { loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initCount } from './client/count';
import { renderSite } from './site';
import { MAP, ROADS } from './test-map';

const brand = loadBrand();
const { t } = createI18n(DEFAULT_LOCALE);
const home = renderSite(brand, { year: 2027, map: MAP, roads: ROADS, script: '' })['index.html'] ?? '';

afterEach(() => vi.unstubAllGlobals());

describe('the level of the landing (docs/60)', () => {
  it('loads the brand font before the first screen', () => {
    expect(home).toContain(
      '<link rel="preload" href="/fonts/brand.woff2" as="font" type="font/woff2" crossorigin>',
    );
    expect(home).toContain('font-family:Brand;src:url(/fonts/brand.woff2)');
  });

  it('moves a light along every road of the map picture', () => {
    expect(home).toContain('viewBox="20 540 1040 740"');
    expect(home.match(/<animateMotion /gu)).toHaveLength(ROADS.routes.length);
    expect(home).toContain('path="M809 921Q700 900 600 1000"');
  });

  it('shows only true numbers taken from the data of the brand', () => {
    expect(home).toContain(`<b data-count-up="2">2</b><span>${t('landing.numbers.regions')}</span>`);
    expect(home).toContain(`<b data-count-up="${brand.channels.length}">`);
    expect(home).toContain(`<b data-count-up="1">1</b><span>${t('landing.numbers.minute')}</span>`);
  });

  it('counts the numbers up once when they come into view, and keeps them still for less motion', () => {
    document.body.innerHTML = '<b data-count-up="14">14</b>';
    initCount(document, false);
    expect(document.body.textContent).toBe('14');
    let seen: (entries: { isIntersecting: boolean; target: Element }[]) => void = () => undefined;
    const unobserve = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof seen) {
          seen = callback;
        }
        observe = vi.fn();
        unobserve = unobserve;
      },
    );
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (frame: FrameRequestCallback) => frames.push(frame));
    initCount(document, true);
    const item = document.querySelector('b') as Element;
    seen([{ isIntersecting: false, target: item }]);
    seen([{ isIntersecting: true, target: item }]);
    expect(unobserve).toHaveBeenCalledWith(item);
    frames.shift()?.(performance.now());
    expect(Number(item.textContent)).toBeLessThan(14);
    frames.shift()?.(performance.now() + 5000);
    expect(item.textContent).toBe('14');
    expect(frames).toHaveLength(0);
  });
});
