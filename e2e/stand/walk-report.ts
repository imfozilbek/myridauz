import { mkdirSync, writeFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import type { MiniApp } from '@platform/contracts';
import { openAs, type Person } from './stand-kit';
import { walk, type Finding, type WalkReport } from './walk';

// pnpm stand:walk (G90, docs/75): the walk changes the data of the stand as a person does (books,
// cancels, sends), so it runs on its own fresh stand, never inside the other scenarios.
export const WALKING = process.env['STAND_WALK'] === '1';
const DIR = 'screenshots/stand/walk';
// One walk of one person takes minutes: the robot taps everything it reaches.
export const WALK_MS = 15 * 60 * 1000;

const row = (finding: Finding) =>
  `| ${finding.kind} | ${finding.at} | ${finding.path} | ${finding.detail.replace(/\s+/gu, ' ').replace(/\|/gu, '/')} |`;

function write(name: string, report: WalkReport) {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(`${DIR}/${name}.json`, JSON.stringify(report, null, 2));
  const lines = [
    `# ${name}`,
    '',
    `Screens: ${report.screens}; taps: ${report.taps}; named screens: ${report.named.join(', ')}`,
    '',
    '| Kind | Screen | Path | Detail |',
    '|---|---|---|---|',
    ...report.findings.map(row),
  ];
  writeFileSync(`${DIR}/${name}.md`, `${lines.join('\n')}\n`);
}

// Walks one Mini App as one person from a start (a bot button adds a search such as ?booking=<id>).
export async function walkAs(page: Page, name: string, app: MiniApp, person: Person, search = '') {
  const report = await walk(page, () => openAs(page, app, person, { search }));
  write(name, report);
  return report;
}
