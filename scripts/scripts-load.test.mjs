import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

// The scripts of the deploy run in plain Node, not through a bundler: every import must load there.
// Without --brand each one stops at its own first check, after all imports (G57, lesson 131).
const SCRIPTS = ['deploy', 'map-data'];

describe('the scripts of the deploy', () => {
  it.each(SCRIPTS)('%s loads in Node', (script) => {
    const run = spawnSync('node', [`scripts/${script}.mjs`], { encoding: 'utf8' });
    expect(run.stderr).not.toContain('ERR_MODULE_NOT_FOUND');
    expect(run.stderr).toContain('--brand');
  });
});
