import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { loadBrand } from '../brands/index.ts';

// The scripts of the deploy run in plain Node, not through a bundler: every import must load there.
// Without --brand each one stops at its own first check, after all imports (G57, lesson 131).
const SCRIPTS = ['deploy', 'map-data', 'setup-bots'];

describe('the scripts of the deploy', () => {
  it.each(SCRIPTS)('%s loads in Node', (script) => {
    const run = spawnSync('node', [`scripts/${script}.mjs`], { encoding: 'utf8' });
    expect(run.stderr).not.toContain('ERR_MODULE_NOT_FOUND');
    expect(run.stderr).toContain('--brand');
  });

  // docs/179: a command that reaches Cloudflare or Telegram never goes to production by default.
  it.each(SCRIPTS)('%s needs the environment', (script) => {
    const run = spawnSync('node', [`scripts/${script}.mjs`, `--brand=${loadBrand().id}`], {
      encoding: 'utf8',
    });
    expect(run.stderr).toContain('--env=<internal|production> is required');
  });
});
