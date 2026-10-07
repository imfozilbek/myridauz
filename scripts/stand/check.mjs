// pnpm stand:check: the scenarios on stands side by side (docs/75). One build and one prepared database
// first; then each stand gets its own ports and its own copy of the data, and runs its part of the files.
// With files or a filter (pnpm stand:check e2e/stand/chat.spec.ts) one stand runs only them: the quick check.
// A piece by theme: --area registration; the pieces of what this branch changed: --changed (G71).
import { execFileSync, spawn } from 'node:child_process';
import { pickFiles } from './areas.mjs';

const FULL_SHARDS = 4;
const { files: args, areas, asked } = pickFiles(process.argv.slice(2));
if (asked && args.length === 0) {
  console.log('stand:check: nothing the stand walks has changed');
  process.exit(0);
}
if (asked) console.log(`stand:check: ${areas.join(', ')}`);
const shards = Number(process.env.STAND_SHARDS ?? (args.length > 0 ? 1 : FULL_SHARDS));
const started = Date.now();

if (process.env.STAND_REUSE !== '1')
  execFileSync('node', ['scripts/stand/stand.mjs', '--prepare'], { stdio: 'inherit' });

const runShard = (index) =>
  new Promise((done) => {
    const split = shards > 1 ? [`--shard=${index}/${shards}`, '--pass-with-no-tests'] : [];
    const child = spawn(
      'pnpm',
      ['exec', 'playwright', 'test', '-c', 'playwright.stand.config.ts', ...split, ...args],
      {
        stdio: 'inherit',
        env: { ...process.env, STAND_SHARD: String(shards > 1 ? index : 0), STAND_BUILT: '1' },
      },
    );
    child.on('exit', (code) => done(code ?? 1));
  });

const codes = await Promise.all(Array.from({ length: shards }, (_, i) => runShard(i + 1)));
const failed = codes.filter((code) => code !== 0).length;
const seconds = Math.round((Date.now() - started) / 1000);
console.log(`stand:check: ${shards - failed}/${shards} stands green in ${seconds} s`);
process.exit(failed === 0 ? 0 : 1);
