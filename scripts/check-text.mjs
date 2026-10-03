import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { findViolations, isTextFile } from './text-rules.mjs';

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
  encoding: 'utf8',
})
  .split('\0')
  .filter((path) => path && isTextFile(path) && existsSync(path));

// A brand is a folder of brands/; node_modules and hidden folders (the .tsc of typecheck) are not.
const brandIds = readdirSync('brands', { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.'))
  .map((entry) => entry.name);

const violations = files.flatMap((path) => findViolations(path, readFileSync(path, 'utf8'), brandIds));

if (violations.length > 0) {
  console.error(violations.join('\n'));
  process.exit(1);
}
console.log(`check:text ok, ${files.length} files`);
