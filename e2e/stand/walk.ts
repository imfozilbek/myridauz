import type { Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { pressBack } from '../telegram-mock';
import { flushScreens, marksOf, settle, watchEffects } from './walk-effects';
import { order, press, standsFor } from './walk-moves';
import { readScreen, type ScreenState, type Target } from './walk-screen';

// The walk of the screens (G90): from the main screen the robot taps every target of every screen it
// reaches, as a person may, and writes down where a person gets stuck or a tap makes no sense.
//  dead_end: not the main screen, no «Назад», no button of Telegram, nothing to tap;
//  no_back: not the main screen and no «Назад»: Android «Назад» closes the whole app there;
//  dead_tap: a tap that changes nothing, calls nothing, opens nothing;
//  refused: the screen offered a tap and the server said no to it;
//  error_screen: the screen shows the general error;
//  lost: after a tap the robot cannot come back by «Назад» or by the same taps from the start.
type FindingKind = 'dead_end' | 'no_back' | 'dead_tap' | 'refused' | 'error_screen' | 'lost';
export type Finding = {
  readonly kind: FindingKind;
  readonly at: string;
  readonly path: string;
  readonly detail: string;
};
export type WalkReport = {
  readonly findings: Finding[];
  readonly screens: number;
  readonly taps: number;
  readonly named: string[];
};

const { t } = createI18n(DEFAULT_LOCALE);
// A walk of one person stops after this: the stand runs several people in one file.
const LIMITS = { depth: 7, taps: 400, perScreen: 30, ms: 10 * 60 * 1000 };
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
  const add = (kind: FindingKind, state: ScreenState, path: readonly Target[], detail: string) =>
    findings.push({
      kind,
      at: state.heading || state.main || state.targets[0]?.label || '(empty)',
      path: path.map((step) => (step.nth > 0 ? `${step.label} #${step.nth + 1}` : step.label)).join(' › '),
      detail,
    });

  const judge = (path: readonly Target[], state: ScreenState) => {
    if (state.text.includes(t('errors.generic.title')))
      add('error_screen', state, path, state.text.slice(0, 200));
    if (state.home || state.back || path.length === 0) return;
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

  const replay = async (path: readonly Target[]) => {
    await start();
    for (const step of path) {
      await press(page, step);
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
    for (const target of order(state).slice(0, limits.perScreen)) {
      if (taps >= limits.taps || Date.now() > until) return;
      if (!(await reach(path, state, target))) {
        const there = await readScreen(page);
        add(
          'lost',
          state,
          path,
          `before «${target.label}»: found «${there.heading}», ${there.targets.length} targets`,
        );
        continue;
      }
      const now = await readScreen(page);
      const before = {
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
      const quiet = calls.length === 0 && (await effects.telegram()) === before.telegram;
      if (same && quiet && (await marksOf(page)) === before.marks)
        add('dead_tap', state, [...path, target], 'nothing changed');
      if (after.key !== state.key) await visit([...path, target], after);
    }
  };

  await start();
  await visit([], await readScreen(page));
  await flushScreens(page);
  return { findings, screens: seen.size - walked, taps, named: [...new Set(effects.screens)].sort() };
}
