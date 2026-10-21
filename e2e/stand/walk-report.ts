import { mkdirSync, writeFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import type { MiniApp } from '@platform/contracts';
import { expect, test } from '../crash-guard';
import { NARROW } from './screen-tour';
import { openAs, type Person } from './stand-kit';
import { walk } from './walk';
import type { Finding, WalkReport } from './walk-types';

// pnpm stand:walk (G91, docs/75): the walk changes the data of the stand as a person does (books,
// cancels, sends), so it runs on its own fresh stand, never inside the other scenarios.
const WALKING = process.env['STAND_WALK'] === '1';
const DIR = 'screenshots/stand/walk';
// One walk of one person takes minutes: the robot taps everything it reaches.
const WALK_MS = 15 * 60 * 1000;
const PREPARE_MS = 3 * 60 * 1000;

// A cell of the table: one line, and a «|» of a name («Rida | Oʻzbekiston») does not split it.
const cell = (words: string) => words.replace(/\s+/gu, ' ').replace(/\|/gu, '/');
const row = (finding: Finding) =>
  `| ${finding.kind} | ${cell(finding.at)} | ${cell(finding.path)} | ${cell(finding.detail)} |`;

function write(name: string, report: WalkReport) {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(`${DIR}/${name}.json`, JSON.stringify(report, null, 2));
  const lines = [
    `# ${name}`,
    '',
    `Screens: ${report.screens}; taps: ${report.taps}; drifts: ${report.drifts}; named: ${report.named.join(', ')}`,
    '',
    '| Kind | Screen | Path | Detail |',
    '|---|---|---|---|',
    ...report.findings.map(row),
  ];
  writeFileSync(`${DIR}/${name}.md`, `${lines.join('\n')}\n`);
}

// Walks one Mini App as one person; seen: the screens the people before walked already.
async function walkAs(page: Page, name: string, app: MiniApp, person: Person, seen: Set<string>) {
  const report = await walk(page, () => openAs(page, app, person), seen);
  write(name, report);
  return report;
}

// The tests of one file of the walk: its people in order, after prepare made them on its stand.
// One walk of a screen is enough: the next person of the same app skips the screens walked before.
export function walkEach(
  people: readonly (readonly [string, MiniApp, Person])[],
  prepare: () => Promise<unknown>,
) {
  test.skip(!WALKING, 'the walk runs on its own fresh stands: pnpm stand:walk (docs/75)');
  test.use({ viewport: NARROW, actionSheets: 'keep' });
  test.describe.configure({ mode: 'serial' });
  test.beforeAll(async () => {
    test.setTimeout(PREPARE_MS);
    await prepare();
  });
  const seen = new Map<MiniApp, Set<string>>();
  const found: Finding[] = [];
  for (const [name, app, person] of people)
    test(`${name}: the robot walks every screen it reaches`, async ({ page }) => {
      test.setTimeout(WALK_MS);
      const walked = seen.get(app) ?? new Set<string>();
      seen.set(app, walked);
      found.push(...(await walkAs(page, name, app, person, walked)).findings);
    });
  // The people of a file walk one after another; the findings of all of them fail the file at the end.
  test('every screen has a way out and every tap does something', () => {
    expect(found).toEqual([]);
  });
}
