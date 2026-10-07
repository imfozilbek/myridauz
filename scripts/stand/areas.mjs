// The pieces of the stand by theme (G71, docs/75): each scenario file belongs to one area, so a change
// is checked by its own piece in about a minute; the whole stand runs only at the end of a goal.
import { execFileSync } from 'node:child_process';

const DIR = 'e2e/stand';
export const AREAS = {
  registration: ['first-contact', 'forms', 'screens-passenger', 'all-passenger-flows'],
  search: ['passenger-search', 'passenger-directions', 'g24', 'combos', 'g33'],
  map: ['g26', 'dropoff-screen'],
  booking: [
    'passenger-booking',
    'g21',
    'chat',
    'family',
    'after-ride',
    'edges',
    'g43',
    'g54',
    'all-passenger',
    'findings',
  ],
  requests: ['passenger-requests', 'requests-review'],
  driver: [
    'driver-account',
    'driver-market',
    'driver-screens',
    'screens-driver',
    'all-driver',
    'trip-changes',
  ],
  team: ['team', 'team-moderation', 'screens-team', 'all-admin'],
  bots: ['bots', 'bots-team', 'complaints-time'],
  channels: ['system-channels', 'system-cron', 'system-people'],
};
const NAMES = Object.keys(AREAS);

// The path of the code → the areas that walk it. A path of code that no rule knows wakes every area:
// better a longer check than a missed one.
const RULES = [
  [/users|account|legal|registration|flow\/|company/, ['registration']],
  [/locations|search|market|favorites|history/, ['search']],
  [/map|pitaks|places|way/, ['map']],
  [/bookings|chat|shares|follow|call|ratings|feedback|comfort|network|sounds|feed/, ['booking']],
  [/ride-requests|assignments|requests/, ['requests']],
  [/drivers?\b|drivers\/|trips|wallet|billing|pricing|media/, ['driver']],
  [/miniapp-admin|team|moderation|stats|analytics/, ['team']],
  [/bots?\b|telegram|support|notifications|reminders|complaints/, ['bots']],
  [/channels|route-subscriptions|subscriptions|reminders|cron|scheduled/, ['channels']],
];
const CODE = /^(apps|packages|brands|scripts\/stand|e2e\/stand|playwright\.stand)/;
const IGNORED = /\.(md|png|webp|jpg|svg|html)$|\.test\.tsx?$|^apps\/landing\//;

export const filesOf = (areas) =>
  areas.flatMap((area) => AREAS[area].map((name) => `${DIR}/${name}.spec.ts`));

// The areas a list of changed paths wakes; an empty list when nothing the stand walks has changed.
export function areasOf(paths) {
  const woken = new Set();
  for (const path of paths) {
    if (!CODE.test(path) || IGNORED.test(path)) continue;
    const spec = path.match(/^e2e\/stand\/(.+)\.spec\.ts$/)?.[1];
    const own = spec ? NAMES.filter((area) => AREAS[area].includes(spec)) : [];
    const ruled = spec ? own : RULES.filter(([rule]) => rule.test(path)).flatMap(([, areas]) => areas);
    for (const area of ruled.length > 0 ? ruled : NAMES) woken.add(area);
  }
  return NAMES.filter((area) => woken.has(area));
}

// The paths changed on this branch against main, committed or not.
function changedPaths() {
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).split('\n').filter(Boolean);
  const base = git('merge-base', 'HEAD', 'origin/main')[0];
  const untracked = git('ls-files', '--others', '--exclude-standard');
  return [...git('diff', '--name-only', base), ...untracked];
}

// The command line of pnpm stand:check → the files to run and the words of the report.
// --area <name> (more than once, or a list with commas), --changed, or files as before.
export function pickFiles(args) {
  const rest = [];
  const areas = new Set();
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--area') for (const area of (args[++i] ?? '').split(',')) areas.add(area);
    else if (args[i] === '--changed') for (const area of areasOf(changedPaths())) areas.add(area);
    else if (args[i] === '--shots') continue;
    else rest.push(args[i]);
  }
  const unknown = [...areas].filter((area) => !NAMES.includes(area));
  if (unknown.length > 0)
    throw new Error(`stand:check: no area ${unknown.join(', ')}; areas: ${NAMES.join(', ')}`);
  const chosen = NAMES.filter((area) => areas.has(area));
  const asked = args.includes('--area') || args.includes('--changed');
  return { files: [...filesOf(chosen), ...rest], areas: chosen, asked };
}
