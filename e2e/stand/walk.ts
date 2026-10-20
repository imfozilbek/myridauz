import type { Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { pressBack } from '../telegram-mock';
import { settle, watchEffects } from './walk-effects';
import { countSounds, flushScreens, marksOf } from './walk-marks';
import { order, press, standsFor } from './walk-moves';
import { readScreen, shape, type ScreenState, type Target } from './walk-screen';
import type { Finding, FindingKind, WalkReport } from './walk-types';

// The walk of the screens (G90): from the main screen the robot taps every target of every screen it
// reaches, as a person may, and writes down where a person gets stuck (the kinds: walk-types.ts).
const { t } = createI18n(DEFAULT_LOCALE);
// A walk of one person stops after this: the stand runs several people in one file.
const LIMITS = { depth: 12, taps: 400, perScreen: 30, ms: 8 * 60 * 1000 };
// No path of the apps is deeper than this: «Назад» so many times always reaches the main screen.
const MOST_BACKS = 8;

// seen: the screens other people of the same app walked already; one walk of each is enough.
export async function walk(
  page: Page,
  open: () => Promise<void>,
  seen = new Set<string>(),
  limits = LIMITS,
): Promise<WalkReport> {
  const effects = watchEffects(page);
  const findings: Finding[] = [];
  const until = Date.now() + limits.ms;
  const walked = seen.size;
  let taps = 0;
  let drifts = 0;
  let root = '';
  const add = (kind: FindingKind, state: ScreenState, path: readonly Target[], detail: string) =>
    findings.push({
      kind,
      at: state.heading || state.main || state.targets[0]?.label || '(empty)',
      path: path.map((step) => (step.nth > 0 ? `${step.label} #${step.nth + 1}` : step.label)).join(' › '),
      detail,
    });

  // The general error names the call that failed last: the reason to look at.
  const failed = () => effects.calls.findLast((call) => call.status === 0 || call.status >= 400);
  const judge = (path: readonly Target[], state: ScreenState) => {
    if (state.text.includes(t('errors.generic.title'))) {
      const call = failed();
      add(
        'error_screen',
        state,
        path,
        call ? `${call.method} ${call.path} → ${call.status} ${call.error}` : '',
      );
    }
    // The first screen of the app has no «Назад» in all its states: the main one, the welcome.
    if (state.home || state.back || path.length === 0 || shape(state.heading) === root) return;
    const nothing = !state.main && !state.second && state.targets.length === 0;
    add(nothing ? 'dead_end' : 'no_back', state, path, state.text.slice(0, 200));
  };

  // A new open brings back the last screen, as Telegram does (docs/94): «Назад» down to the main one.
  const start = async () => {
    await open();
    await settle(page);
    for (let step = 0; step < MOST_BACKS && (await readScreen(page)).back; step += 1) {
      await pressBack(page);
      await settle(page);
    }
  };

  // The same taps again; a tap that is gone, or the time that is over, ends it (a drift).
  const replay = async (path: readonly Target[]) => {
    await start();
    for (const step of path) {
      if (Date.now() > until || !(await press(page, step))) return;
      await settle(page);
    }
  };

  // Back to a screen already walked: by «Назад» first, as a person, else by the same taps again.
  const reach = async (path: readonly Target[], state: ScreenState, target: Target): Promise<boolean> => {
    if (await standsFor(page, state, target)) return true;
    if ((await readScreen(page)).back && path.length > 0) {
      await pressBack(page);
      await settle(page);
      if (await standsFor(page, state, target)) return true;
    }
    await replay(path);
    return standsFor(page, state, target);
  };

  const visit = async (path: readonly Target[], state: ScreenState): Promise<void> => {
    if (seen.has(state.key)) return;
    seen.add(state.key);
    judge(path, state);
    if (path.length >= limits.depth) return;
    const kept: Target[] = [];
    for (const target of order(state).slice(0, limits.perScreen)) {
      if (taps >= limits.taps || Date.now() > until) return;
      if (!(await reach(path, state, target))) {
        drifts += 1;
        continue;
      }
      const now = await readScreen(page);
      const before = {
        asked: effects.asked(),
        calls: effects.calls.length,
        telegram: await effects.telegram(),
        marks: await marksOf(page),
      };
      taps += 1;
      if (!(await press(page, target))) continue;
      await settle(page);
      const after = await readScreen(page);
      const calls = effects.calls.slice(before.calls);
      for (const call of calls.filter((made) => made.status >= 400))
        add(
          'refused',
          state,
          [...path, target],
          `${call.method} ${call.path} → ${call.status} ${call.error}`,
        );
      const same = after.key === now.key && after.text === now.text;
      const quiet = effects.asked() === before.asked && (await effects.telegram()) === before.telegram;
      const marked = (await marksOf(page)) !== before.marks;
      if (same && quiet && !marked) add('dead_tap', state, [...path, target], 'nothing changed');
      // Ticks and typed words stay on the screen: the next screen comes after all of them (two
      // consents, then «Davom etish»), so its path holds them too.
      if (after.key === state.key && (marked || !same)) kept.push(target);
      if (after.key !== state.key) await visit([...path, ...kept, target], after);
    }
  };

  await countSounds(page);
  await start();
  const first = await readScreen(page);
  root = shape(first.heading);
  await visit([], first);
  await flushScreens(page);
  return { findings, screens: seen.size - walked, taps, drifts, named: [...new Set(effects.screens)].sort() };
}
