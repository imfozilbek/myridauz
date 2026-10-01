import { describe, expect, it } from 'vitest';
import { isRegionId, regionOf } from '../map';
import { allPitaks, pitakHistory, removeDirection, saveDirection, savePitak } from './application/admin';
import { pitakOfDirection } from './application/pitaks';
import type { PitaksDeps } from './application/ports';
import { createMemoryPitaks } from './infrastructure/memory-pitaks';

const TOSHKENT = '1726';
const SAMARQAND = '1718';
const MODERATOR = 905;
const AVTOVOKZAL = { lat: 41.2569, lng: 69.1925 };

function setup() {
  let id = 0;
  const deps: PitaksDeps = {
    store: createMemoryPitaks(),
    regionOf,
    isRegion: isRegionId,
    now: () => 1000,
    newId: () => `p${(id += 1)}`,
  };
  return deps;
}
const input = (status: string, point = AVTOVOKZAL) => ({ name: 'Toshkent avtovokzali', point, status });

describe('pitaks and live directions (G24, docs/72)', () => {
  it('takes the region from the point and keeps every change in the history', async () => {
    const deps = setup();
    const created = await savePitak(deps, MODERATOR, null, input('candidate'));
    expect(created).toMatchObject({ ok: true, value: { id: 'p1', regionId: TOSHKENT, status: 'candidate' } });
    await savePitak(deps, MODERATOR, 'p1', input('claude'));
    const history = await pitakHistory(deps);
    expect(history.map((change) => change.subject)).toEqual(['pitak:p1', 'pitak:p1']);
    expect(JSON.parse(history[0]?.after ?? '{}')).toMatchObject({ status: 'claude' });
  });

  it('refuses a point abroad, a wrong input and an unknown pitak', async () => {
    const deps = setup();
    const abroad = await savePitak(deps, MODERATOR, null, input('claude', { lat: 43.24, lng: 76.9 }));
    expect(abroad).toEqual({ ok: false, error: 'pitaks.invalid_input' });
    expect(await savePitak(deps, MODERATOR, null, { name: 'x' })).toEqual({
      ok: false,
      error: 'pitaks.invalid_input',
    });
    expect(await savePitak(deps, MODERATOR, 'nope', input('claude'))).toEqual({
      ok: false,
      error: 'pitaks.not_found',
    });
  });

  it('shows the main pitak of a direction only when Claude chose it or people checked it', async () => {
    const deps = setup();
    await savePitak(deps, MODERATOR, null, input('candidate'));
    const direction = { from: TOSHKENT, to: SAMARQAND, pitakId: 'p1' };
    expect(await saveDirection(deps, MODERATOR, direction)).toEqual({ ok: true, value: direction });
    expect(await pitakOfDirection(deps, TOSHKENT, SAMARQAND)).toBeNull();
    await savePitak(deps, MODERATOR, 'p1', input('checked'));
    expect(await pitakOfDirection(deps, TOSHKENT, SAMARQAND)).toEqual({
      id: 'p1',
      name: 'Toshkent avtovokzali',
      point: AVTOVOKZAL,
    });
    expect(await pitakOfDirection(deps, SAMARQAND, TOSHKENT)).toBeNull();
  });

  it('takes a pitak only from the region the direction starts from, and only between regions', async () => {
    const deps = setup();
    await savePitak(deps, MODERATOR, null, input('claude'));
    const wrong = { ok: false, error: 'pitaks.invalid_input' };
    expect(await saveDirection(deps, MODERATOR, { from: SAMARQAND, to: TOSHKENT, pitakId: 'p1' })).toEqual(
      wrong,
    );
    expect(await saveDirection(deps, MODERATOR, { from: TOSHKENT, to: TOSHKENT, pitakId: null })).toEqual(
      wrong,
    );
    expect(await saveDirection(deps, MODERATOR, { from: '1726294', to: SAMARQAND, pitakId: null })).toEqual(
      wrong,
    );
    expect(await saveDirection(deps, MODERATOR, { from: TOSHKENT, to: SAMARQAND, pitakId: 'nope' })).toEqual({
      ok: false,
      error: 'pitaks.not_found',
    });
  });

  it('removes a direction that is no longer live', async () => {
    const deps = setup();
    await saveDirection(deps, MODERATOR, { from: TOSHKENT, to: SAMARQAND, pitakId: null });
    expect(await removeDirection(deps, MODERATOR, TOSHKENT, SAMARQAND)).toBe(true);
    expect(await removeDirection(deps, MODERATOR, TOSHKENT, SAMARQAND)).toBe(false);
    expect((await allPitaks(deps)).directions).toEqual([]);
  });
});
