// @vitest-environment jsdom
import { loadBrand } from '@platform/brands';
import { LEGAL_EDITION } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { describe, expect, it } from 'vitest';
import { documentPage } from '../document';
import { initCompany } from './company';

const brand = loadBrand();
const i18n = createI18n(DEFAULT_LOCALE);
const company = {
  legalName: 'Yoʻldosh <b>Servis</b>',
  form: 'MChJ',
  stir: '123456789',
  address: 'Toshkent shahri',
  email: 'info@example.uz',
};
const mount = () => {
  document.body.innerHTML = documentPage('offer', brand, i18n);
  return document.querySelector<HTMLElement>('[data-legal]') as HTMLElement;
};
const answer =
  (body: unknown, ok = true) =>
  async () => ({ ok, json: async () => body });
const edition = () => document.querySelector('[data-edition]')?.textContent ?? '';

describe('legal document script (G34)', () => {
  it('fills the requisites and the edition the owner saved, as text only', async () => {
    const root = mount();
    const asked: string[] = [];
    await initCompany(root, async (url) => {
      asked.push(url);
      return answer({ company, edition: { version: '1.3', date: '2026-10-05' } })();
    });
    expect(asked).toEqual([`https://api.${brand.domain}/public/company`]);
    expect(edition()).toBe(i18n.t('legal.edition', { version: '1.3', date: '5-oktabr 2026' }));
    expect(document.querySelector('[data-company]')?.textContent).toBe(
      'Yoʻldosh <b>Servis</b> (MChJ, STIR 123456789, manzil: Toshkent shahri)',
    );
    expect(document.querySelector('b')).toBeNull();
    expect(document.querySelector('[data-email]')?.textContent).toBe('info@example.uz');
    expect(document.body.textContent).not.toMatch(/\{/u);
  });

  it('keeps the brand name before the first save and the page as built without an answer', async () => {
    await initCompany(mount(), answer({ company: null, edition: LEGAL_EDITION }));
    expect(document.querySelector('[data-company]')?.textContent).toBe(brand.name);
    expect(edition()).toContain(`Tahrir ${LEGAL_EDITION.version}`);
    const built = mount();
    const before = built.innerHTML;
    await initCompany(built, answer({}, false));
    await initCompany(built, async () => Promise.reject(new Error('offline')));
    expect(built.innerHTML).toBe(before);
  });
});
