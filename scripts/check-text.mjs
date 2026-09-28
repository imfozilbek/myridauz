import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { findViolations, isTextFile } from './text-rules.mjs';

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
  encoding: 'utf8',
})
  .split('\0')
  .filter((path) => path && isTextFile(path));

const brandIds = readdirSync('brands', { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== 'node_modules')
  .map((entry) => entry.name);

const violations = files.flatMap((path) => findViolations(path, readFileSync(path, 'utf8'), brandIds));

if (violations.length > 0) {
  console.error(violations.join('\n'));
  process.exit(1);
}
console.log(`check:text ok, ${files.length} files`);
