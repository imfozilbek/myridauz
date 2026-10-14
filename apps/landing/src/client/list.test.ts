// @vitest-environment jsdom
import { loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { describe, expect, it } from 'vitest';
import { actions } from '../sections/hero';
import { initList } from './list';

const brand = loadBrand();
const shown = () =>
  [...document.querySelectorAll<HTMLAnchorElement>('a')]
    .filter((link) => !link.hidden)
    .map((link) => link.href);
const answer =
  (body: unknown, ok = true) =>
  async () => ({ ok, json: async () => body });

describe('the buttons of the site and the list of waiting (G83, docs/181)', () => {
  const main = `https://t.me/${brand.bots.main}?start=site`;
  const mount = () => {
    document.body.innerHTML = actions(brand, createI18n(DEFAULT_LOCALE));
  };

  it('leads to the main bot while the list is open, and when the answer does not come', async () => {
    for (const load of [
      answer({ open: true }),
      answer(null, false),
      () => Promise.reject(new Error('net')),
    ]) {
      mount();
      await initList(document.body, load);
      expect(shown()).toEqual([main, main]);
    }
  });

  it('shows the buttons into the trips when the owner closes the list', async () => {
    mount();
    await initList(document.body, answer({ open: false }));
    expect(shown()).toEqual([`https://t.me/${brand.bots.passenger}`, `https://t.me/${brand.bots.driver}`]);
  });
});
