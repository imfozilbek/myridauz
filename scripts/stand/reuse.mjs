// What the stand does not repeat when nothing changed (G71, docs/75): the build of the Mini Apps, the
// migrations of the clean base, and the copy of the map. A piece is checked again in seconds, not minutes.
import {
  cpSync,
  existsSync,
  linkSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

const SKIP = new Set(['node_modules', 'dist', '.wrangler', 'brand-kit']);

// The newest change time of the files under the folders, without builds and dependencies.
function newestChange(paths) {
  let newest = 0;
  const walk = (path) => {
    const stat = statSync(path, { throwIfNoEntry: false });
    if (!stat) return;
    if (!stat.isDirectory()) newest = Math.max(newest, stat.mtimeMs);
    else for (const name of readdirSync(path)) if (!SKIP.has(name)) walk(join(path, name));
  };
  for (const path of paths) walk(path);
  return newest;
}

// The Mini Apps are built again only when their code, the packages or the brand changed after the
// last build of the stand, or when the build of one app is older than the code: a stamp alone once
// served the old main screen of the driver (G66, lesson 192).
const APPS = ['apps/miniapp-passenger', 'apps/miniapp-driver', 'apps/miniapp-admin'];
const SOURCES = [...APPS, 'packages', 'brands', 'pnpm-lock.yaml'];
const BUILDS = APPS.map((app) => join(app, 'dist/index.html'));
// The build must be the one of the stand too: the e2e servers build the same folders with their own
// API address, and the stand once served that build (every request 404, lesson 202).
export function buildIsFresh(stamp, sources = SOURCES, builds = BUILDS) {
  if (!existsSync(stamp)) return false;
  const [startedAt, endedAt] = readFileSync(stamp, 'utf8').split(' ').map(Number);
  if (!endedAt) return false;
  const newest = newestChange(sources);
  const ours = (path) => {
    const at = statSync(path, { throwIfNoEntry: false })?.mtimeMs ?? 0;
    return at > newest && at <= endedAt;
  };
  return newest < startedAt && builds.every(ours);
}
export const markBuilt = (stamp, startedAt) => writeFileSync(stamp, `${startedAt} ${Date.now()}`);

// The list of migrations the clean base already has: new ones are applied to the base once.
const migrations = (folder) =>
  readdirSync(folder)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .join('\n');
export const baseIsCurrent = (stamp, folder) =>
  existsSync(stamp) && readFileSync(stamp, 'utf8') === migrations(folder);
export const markBase = (stamp, folder) => writeFileSync(stamp, migrations(folder));

// A copy of the clean data for one run. The files of the bucket never change after they are written
// (the map alone is 243 MB), so the copy links them instead of copying; the databases are copied.
export function copyState(from, to) {
  const walk = (source, target) => {
    mkdirSync(target, { recursive: true });
    for (const entry of readdirSync(source, { withFileTypes: true })) {
      const [inner, outer] = [join(source, entry.name), join(target, entry.name)];
      if (entry.isDirectory()) walk(inner, outer);
      else if (source.endsWith('blobs')) linkSync(inner, outer);
      else cpSync(inner, outer);
    }
  };
  walk(from, to);
}
