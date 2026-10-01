// @vitest-environment jsdom
import { channelOf, loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { how } from '../sections/how';
import { mapSection } from '../sections/map';
import { pains } from '../sections/pains';
import { MAP } from '../test-map';
import { fill, groupThousands } from './format';
import { initHow } from './how';
import { initMap } from './map';
import { initPains } from './pains';

const brand = loadBrand();
const i18n = createI18n(DEFAULT_LOCALE);
const mount = (html: string) => {
  document.body.innerHTML = html;
  return document.body.firstElementChild as HTMLElement;
};
const click = (selector: string) => document.querySelector<HTMLElement>(selector)?.click();
const text = (selector: string) => document.querySelector(selector)?.textContent ?? '';

beforeEach(() => vi.useRealTimers());

describe('landing script (docs/59)', () => {
  it('formats money from templates of the translations', () => {
    expect(groupThousands(1234567, ' ')).toBe('1 234 567');
    expect(fill('≈ {km} km', 'km', '300')).toBe('≈ 300 km');
  });

  it('switches the old way and the new way', () => {
    const root = mount(pains(brand, i18n));
    initPains(root, false);
    expect(root.dataset['side']).toBe('before');
    click('[data-side-to=after]');
    expect(root.dataset['side']).toBe('after');
    expect(document.querySelector('[data-side-to=after]')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows the screen of a step and the other side on its tab, and plays the steps by itself', () => {
    vi.useFakeTimers();
    const root = mount(how(brand, i18n));
    initHow(root);
    vi.advanceTimersByTime(3600);
    expect(document.querySelectorAll('[data-path=passenger] .screen')[1]?.classList.contains('shown')).toBe(
      true,
    );
    click('[data-tab=driver]');
    expect(document.querySelector('[data-path=driver]')?.classList.contains('shown')).toBe(true);
    document.querySelectorAll<HTMLButtonElement>('[data-path=driver] [data-step] button')[2]?.click();
    expect(document.querySelectorAll('[data-path=driver] .screen')[2]?.classList.contains('shown')).toBe(
      true,
    );
    vi.advanceTimersByTime(8000);
    expect(document.querySelectorAll('[data-path=driver] .screen')[2]?.classList.contains('shown')).toBe(
      true,
    );
  });

  it('shows the road, the live price of the pair, the sum for the seats and opens the bot with the route', async () => {
    const root = mount(mapSection(MAP, brand, i18n));
    const asked: string[] = [];
    await initMap(root, async (url) => {
      asked.push(url);
      return { ok: true, json: async () => ({ from: '1726273', to: '1718401', km: 300, price: 90_000 }) };
    });
    expect(asked).toEqual([`https://api.${brand.domain}/public/price?from=1726273&to=1718401`]);
    expect(text('[data-name=from]')).toBe('Toshkent');
    expect(text('[data-name=to]')).toBe('Samarqand');
    expect(text('[data-km-value]')).toMatch(/^≈\s300\skm$/u);
    expect(text('[data-price]')).toMatch(/^≈\s90\s000\ssoʻm$/u);
    click('[data-more]');
    expect(text('[data-total]')).toMatch(/^≈\s360\s000\ssoʻm$/u);
    click('[data-less]');
    click('[data-less]');
    expect(text('[data-seats-label]')).toContain('2');
    expect(document.querySelector('[data-route]')?.getAttribute('d')).toContain('M71 31');
    expect(document.querySelector('[data-go]')?.getAttribute('href')).toBe(
      `https://t.me/${brand.bots.passenger}?startapp=find_1726_1718`,
    );
    expect(document.querySelector<HTMLAnchorElement>('[data-channel-link]')?.href).toContain(
      channelOf(brand, '1718401')?.username ?? '',
    );
    click('[data-swap]');
    await vi.waitFor(() => expect(text('[data-name=from]')).toBe('Samarqand'));
    expect(document.querySelector('[data-go]')?.getAttribute('href')).toContain('find_1718_1726');
    document.querySelector<SVGElement>('[data-region="1718"]')?.dispatchEvent(new Event('click'));
    await vi.waitFor(() => expect(text('[data-name=from]')).toBe('Toshkent'));
  });

  it('keeps the map without prices when the API does not answer', async () => {
    const root = mount(mapSection(MAP, brand, i18n));
    await initMap(root, async () => {
      throw new Error('offline');
    });
    expect(document.querySelector('[data-price-row]')?.hasAttribute('hidden')).toBe(true);
    expect(text('[data-name=to]')).toBe('Samarqand');
    await initMap(mount(mapSection(MAP, brand, i18n)), async () => ({ ok: false, json: async () => ({}) }));
    expect(document.querySelector('[data-price-row]')?.hasAttribute('hidden')).toBe(true);
  });

  it('puts only codes and usernames into the links', async () => {
    const root = mount(mapSection(MAP, brand, i18n));
    const target = root.querySelector<HTMLOptionElement>('[data-side=to] option[selected]');
    if (target) {
      target.value = 'javascript:alert(1)';
      target.dataset['channel'] = '"><img>';
    }
    await initMap(root, async () => ({ ok: false, json: async () => ({}) }));
    expect(document.querySelector('[data-go]')?.getAttribute('href')).toContain('find_1726_1718');
    expect(document.querySelector('[data-channel-link]')?.getAttribute('href')).not.toContain('img');
  });
});
