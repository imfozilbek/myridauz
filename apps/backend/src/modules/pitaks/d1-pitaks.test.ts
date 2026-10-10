import { describe, expect, it } from 'vitest';
import { testD1 } from '../../test-d1';
import { d1Pitaks } from './infrastructure/d1-pitaks';

// The SQL of the pitaks and the first list of migration 0025 on SQLite (G24, docs/72, docs/73).
describe('pitaks in D1', () => {
  it('has the first list: 39 pitaks, 57 live directions, a main pitak of its own region', async () => {
    const store = d1Pitaks(testD1());
    const [pitaks, directions] = await Promise.all([store.all(), store.directions()]);
    expect(pitaks).toHaveLength(39);
    expect(directions).toHaveLength(57);
    const byId = new Map(pitaks.map((pitak) => [pitak.id, pitak]));
    for (const direction of directions) {
      const main = direction.pitakId ? byId.get(direction.pitakId) : undefined;
      if (direction.pitakId) expect(main?.regionId, direction.pitakId).toBe(direction.from);
      if (main) expect(main.status).toBe('claude');
    }
    expect(await store.direction('1726', '1718')).toMatchObject({ pitakId: 'toshkent-avtovokzal' });
  });

  it('saves, moves and logs', async () => {
    const store = d1Pitaks(testD1());
    const pitak = await store.find('qoyliq');
    if (!pitak) throw new Error('no qoyliq');
    expect(pitak.hint).toBeNull();
    await store.save({ ...pitak, hint: 'Metro yonida', point: { lat: 41.244, lng: 69.34 }, updatedAt: 5 });
    expect(await store.find('qoyliq')).toMatchObject({
      hint: 'Metro yonida',
      point: { lat: 41.244, lng: 69.34 },
    });
    await store.saveDirection({ from: '1726', to: '1718', pitakId: 'sobir-rahimov', updatedAt: 5 });
    expect((await store.direction('1726', '1718'))?.pitakId).toBe('sobir-rahimov');
    expect(await store.removeDirection('1726', '1718')).toBe(true);
    await store.log({ subject: 'pitak:qoyliq', before: null, after: '{}', by: 905, at: 5 });
    expect(await store.history(10)).toEqual([
      { subject: 'pitak:qoyliq', before: null, after: '{}', by: 905, at: 5 },
    ]);
  });
});
