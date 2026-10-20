import { describe, expect, it } from 'vitest';
import { fileComplaint } from './application/file';
import { decide, openComplaint } from './application/moderate';
import { BY_MODERATOR, input, setup } from './complaints-test-kit';

// G89: two taps of one author in one second, and a moderator opening a case another one decides.
describe('complaints in the same second', () => {
  it('takes one complaint of a double tap', async () => {
    const { deps, store } = setup();
    // Both taps read «no complaint yet» before either is written.
    const racing = { ...deps, store: { ...store, ofAuthor: async () => undefined } };
    const answers = await Promise.all([
      fileComplaint(racing, 101, input('b1')),
      fileComplaint(racing, 101, input('b1')),
    ]);
    expect(answers.filter((answer) => answer === 'complaints.already')).toHaveLength(1);
    expect(await store.open()).toHaveLength(1);
  });

  it('keeps a decision when the case is opened from an older read', async () => {
    const { deps, store } = setup();
    const filed = await fileComplaint(deps, 101, input('b1'));
    const id = typeof filed === 'string' ? '' : filed.id;
    const fresh = await store.find(id);
    await decide(deps, BY_MODERATOR, id, { action: 'none', refund: false });
    const stale = { ...deps, store: { ...store, find: async () => fresh } };
    await openComplaint(stale, id);
    expect((await store.find(id))?.status).toBe('resolved');
  });
});
