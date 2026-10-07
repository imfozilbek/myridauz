import { mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { baseIsCurrent, copyState, markBase } from './reuse.mjs';

const folder = () => mkdtempSync(join(tmpdir(), 'stand-'));

describe('what the stand reuses (G71)', () => {
  it('links the files of the bucket and copies the databases', () => {
    const base = folder();
    mkdirSync(join(base, 'r2/media/blobs'), { recursive: true });
    mkdirSync(join(base, 'd1'), { recursive: true });
    writeFileSync(join(base, 'r2/media/blobs/map'), 'tiles');
    writeFileSync(join(base, 'd1/db.sqlite'), 'rows');
    const run = join(folder(), 'state');
    copyState(base, run);
    expect(statSync(join(run, 'r2/media/blobs/map')).ino).toBe(
      statSync(join(base, 'r2/media/blobs/map')).ino,
    );
    writeFileSync(join(run, 'd1/db.sqlite'), 'changed by a scenario');
    expect(readFileSync(join(base, 'd1/db.sqlite'), 'utf8')).toBe('rows');
  });

  it('knows when the base misses a new migration', () => {
    const migrations = folder();
    const stamp = join(folder(), 'stamp');
    writeFileSync(join(migrations, '0001_start.sql'), '');
    expect(baseIsCurrent(stamp, migrations)).toBe(false);
    markBase(stamp, migrations);
    expect(baseIsCurrent(stamp, migrations)).toBe(true);
    writeFileSync(join(migrations, '0002_next.sql'), '');
    expect(baseIsCurrent(stamp, migrations)).toBe(false);
  });
});
