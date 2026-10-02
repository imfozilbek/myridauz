import { DAY_MS } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { KEEP_MS } from './application/history';
import { createMemoryHistory } from './infrastructure/memory-history';

const NOW = Date.parse('2026-10-02T09:00:00Z');
const entry = (personId: number, at: number) =>
  ({ personId, at, author: 'person', name: 'Ali', kind: 'text', text: 'Savol' }) as const;

describe('the support talk (G32)', () => {
  it('keeps 90 days: older messages go, a person forgotten has none', async () => {
    const history = createMemoryHistory();
    await history.add(entry(1, NOW - 91 * DAY_MS));
    await history.add(entry(1, NOW - DAY_MS));
    await history.add(entry(2, NOW));
    await history.purge(NOW - KEEP_MS);
    expect((await history.of(1)).map((saved) => saved.at)).toEqual([NOW - DAY_MS]);
    await history.forget(1);
    expect(await history.of(1)).toEqual([]);
    expect(await history.of(2)).toHaveLength(1);
  });
});
