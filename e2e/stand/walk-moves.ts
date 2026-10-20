import type { Page } from '@playwright/test';
import { readScreen, shape, tap, type ScreenState, type Target } from './walk-screen';

// The moves of the walk (G90): the two buttons of Telegram are targets too, and the order of taps
// on a screen puts the ones that change much last.
const MAIN: Target = { label: '⟨main⟩', nth: 0 };
const SECOND: Target = { label: '⟨second⟩', nth: 0 };
// Taps that change much are tried last on a screen: the rest of it is walked before them.
const LAST = /oʻchir|bekor|blok|chiqish|rad et|tugat|yakun|oʻtkaz|yopish/iu;

export const press = async (page: Page, target: Target) => {
  if (target === MAIN || target === SECOND) {
    const id = target === MAIN ? '#tg-main-button' : '#tg-secondary-button';
    return page
      .locator(id)
      .click({ timeout: 3_000 })
      .then(() => true)
      .catch(() => false);
  }
  return tap(page, target);
};

export const order = (state: ScreenState): Target[] => {
  const native = [state.second ? SECOND : null, state.main ? MAIN : null].filter(
    (t): t is Target => t !== null,
  );
  const safe = state.targets.filter((target) => !LAST.test(target.label));
  const late = state.targets.filter((target) => LAST.test(target.label));
  return [...safe, ...native, ...late];
};

// The robot stands where it can tap the target: the same screen (its title and «Назад») with the
// target on it. The rest of the screen may change on the way: a new trip, a remembered route.
export const standsFor = async (page: Page, state: ScreenState, target: Target) => {
  const now = await readScreen(page);
  if (shape(now.heading) !== shape(state.heading) || now.back !== state.back) return false;
  if (target === MAIN) return now.main !== null;
  if (target === SECOND) return now.second !== null;
  return now.targets.some((there) => shape(there.label) === shape(target.label) && there.nth === target.nth);
};
