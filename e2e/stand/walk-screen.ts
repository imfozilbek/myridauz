import type { Page } from '@playwright/test';
import { telegramEvents } from '../telegram-mock';

// What the walk of the screens (G90) reads from a screen: the way out, the buttons, the words.
// A tap target is any element a person can press: buttons, links, rows with role=button, switches.
export type Target = { readonly label: string; readonly nth: number };
export type ScreenState = {
  readonly key: string;
  readonly back: boolean;
  readonly main: string | null;
  readonly second: string | null;
  readonly targets: readonly Target[];
  readonly text: string;
  readonly heading: string;
  // The main screen of the app: no «Назад» there, Android «Назад» closes the app (docs/94).
  readonly home: boolean;
};

const TAPPABLE = [
  'button',
  'a[href]',
  'select',
  'summary',
  'textarea',
  'input:not([type])',
  ...['checkbox', 'radio', 'text', 'tel', 'number', 'search'].map((type) => `input[type=${type}]`),
  'label:has(input[type=checkbox])',
  'label:has(input[type=radio])',
  ...['button', 'link', 'tab', 'switch', 'checkbox', 'radio', 'option', 'menuitem'].map((r) => `[role=${r}]`),
].join(',');
// The two buttons of Telegram are drawn by the mock outside the page (e2e/telegram-mock.ts).
const NATIVE = ['tg-main-button', 'tg-secondary-button'];

// Numbers, times and prices change from one open to the next: the key of a screen does not hold them.
export const shape = (words: string) => words.replace(/\d+/gu, '#').replace(/\s+/gu, ' ').trim();

// The tap targets of the screen in the order a person sees them, each marked for the next tap.
async function readTargets(page: Page): Promise<{ label: string }[]> {
  return page.evaluate(
    ({ tappable, native }) => {
      const seen = (el: HTMLElement) => {
        const box = el.getBoundingClientRect();
        if (box.width < 2 || box.height < 2) return false;
        return getComputedStyle(el).visibility !== 'hidden' && el.checkVisibility({ opacityProperty: true });
      };
      // Disabled, or under the shade of a sheet: the page under it is aria-hidden and takes no tap.
      const off = (el: HTMLElement) =>
        el.hasAttribute('disabled') ||
        el.getAttribute('aria-disabled') === 'true' ||
        el.closest('[aria-hidden="true"], [inert]') !== null;
      // A button inside a button is one target: the outer one.
      const inner = (el: HTMLElement) => el.parentElement?.closest(tappable) !== null;
      // The chosen one of a group is not a target: a tap on it rightly changes nothing.
      const chosen = (el: HTMLElement) =>
        el.getAttribute('aria-pressed') === 'true' ||
        ((el as HTMLInputElement).checked === true && (el as HTMLInputElement).type === 'radio') ||
        el.querySelector('input[type=radio]:checked') !== null ||
        (['tab', 'radio', 'option'].includes(el.getAttribute('role') ?? '') &&
          [el.getAttribute('aria-selected'), el.getAttribute('aria-checked')].includes('true'));
      // The marks of the last reading go first: a screen gone under keeps its elements.
      for (const old of document.querySelectorAll<HTMLElement>('[data-walk]')) delete old.dataset['walk'];
      const found = [...document.querySelectorAll<HTMLElement>(tappable)].filter(
        (el) => !native.includes(el.id) && seen(el) && !off(el) && !inner(el) && !chosen(el),
      );
      return found.map((el, index) => {
        el.dataset['walk'] = String(index);
        const words =
          el.getAttribute('aria-label') || el.innerText || el.getAttribute('placeholder') || el.title;
        return { label: (words.split('\n')[0] ?? '').trim().slice(0, 60) || el.tagName.toLowerCase() };
      });
    },
    { tappable: TAPPABLE, native: NATIVE },
  );
}

const nativeText = (page: Page, id: string) =>
  page.evaluate((name) => {
    const button = document.getElementById(name) as HTMLButtonElement | null;
    if (!button || button.style.display !== 'block' || button.disabled) return null;
    return button.textContent ?? '';
  }, id);

async function backShown(page: Page): Promise<boolean> {
  const setups = await telegramEvents(page, 'web_app_setup_back_button');
  return setups.at(-1)?.['is_visible'] === true;
}

export async function readScreen(page: Page): Promise<ScreenState> {
  const raw = await readTargets(page);
  const count = new Map<string, number>();
  const targets = raw.map(({ label }) => {
    const nth = count.get(label) ?? 0;
    count.set(label, nth + 1);
    return { label, nth };
  });
  const [back, main, second] = await Promise.all([
    backShown(page),
    nativeText(page, 'tg-main-button'),
    nativeText(page, 'tg-secondary-button'),
  ]);
  const { text, heading, home } = await page.evaluate(() => ({
    text: document.body.innerText,
    // A screen kept under another one keeps its title in the page, unseen (KeptBehind).
    heading:
      [...document.querySelectorAll('h1, h2, [role=heading]')].find((title) => title.checkVisibility())
        ?.textContent ?? '',
    home: document.querySelector('.home')?.checkVisibility() === true,
  }));
  const labels = [...new Set(targets.map((target) => shape(target.label)))].sort();
  const key = JSON.stringify([back, main && shape(main), second && shape(second), shape(heading), labels]);
  return { key, back, main, second, targets, text, heading: heading.trim(), home };
}

// Taps the target the way a person does; a field gets typed words. False when it is gone.
const TYPED: Record<string, string> = { tel: '901234567', number: '2' };
export async function tap(page: Page, target: Target): Promise<boolean> {
  const raw = await readTargets(page);
  const index = raw
    .map((item, at) => ({ ...item, at }))
    .filter((item) => shape(item.label) === shape(target.label))
    .at(target.nth)?.at;
  if (index === undefined) return false;
  const element = page.locator(`[data-walk="${index}"]`);
  await element.scrollIntoViewIfNeeded().catch(() => undefined);
  const field = await element
    .evaluate((el) =>
      el instanceof HTMLTextAreaElement ||
      (el instanceof HTMLInputElement && !['checkbox', 'radio'].includes(el.type))
        ? { type: el.type, value: el.value }
        : null,
    )
    .catch(() => null);
  // A field typed before keeps its words (a draft): the robot types other ones, a change to see.
  const words = field && (TYPED[field.type] ?? 'Salom');
  const typed = words && field?.value === words ? `${words}1` : words;
  const done = typed ? element.fill(typed) : element.click({ timeout: 3_000 });
  return done.then(() => true).catch(() => false);
}
