import { DAY_MS } from '@platform/contracts';
import { publicIdOf } from '../../test-people';
import { describe, expect, it } from 'vitest';
import { fileComplaint, hiddenFromSearch } from './application/file';
import { complaintChat, complaintQueue, decide, openComplaint } from './application/moderate';

import { BY_MODERATOR, DRIVER, input, MODERATOR, NOW, setup } from './complaints-test-kit';

describe('complaints (docs/17)', () => {
  it('takes one complaint per person and ride, only from its two sides', async () => {
    const { deps, log } = setup();
    expect(await fileComplaint(deps, 999, input('b1'))).toBe('complaints.not_found');
    expect(await fileComplaint(deps, 101, input('b1'))).toHaveProperty('id');
    expect(await fileComplaint(deps, 101, input('b1'))).toBe('complaints.already');
    expect(await fileComplaint(deps, DRIVER, { ...input('b1'), reason: 'harassment' })).toHaveProperty('id');
    expect(log).toEqual(['team harassment']);
  });

  it('hides a person from search after 3 different people complain, until the decision', async () => {
    const { deps } = setup();
    for (const n of [1, 2]) await fileComplaint(deps, 100 + n, input(`b${n}`));
    expect(await hiddenFromSearch(deps, [DRIVER])).toEqual(new Set());
    await fileComplaint(deps, 103, input('b3'));
    expect(await hiddenFromSearch(deps, [DRIVER, 55])).toEqual(new Set([DRIVER]));
    const [first] = await complaintQueue(deps);
    await decide(deps, BY_MODERATOR, first?.id ?? '', { action: 'none', refund: false });
    expect(await hiddenFromSearch(deps, [DRIVER])).toEqual(new Set());
  });

  it('puts high priority first and shows both sides with their history', async () => {
    const { deps } = setup();
    await fileComplaint(deps, 101, input('b1'));
    await fileComplaint(deps, 102, input('b2', 'unsafe_driving' as never));
    const queue = await complaintQueue(deps);
    expect(queue.map((known) => known.high)).toEqual([true, false]);
    expect(queue[0]?.against).toMatchObject({ firstName: 'Jasur', role: 'driver', trips: 12, complaints: 2 });
    expect(queue[0]?.author).toMatchObject({ role: 'passenger', trips: 3 });
  });

  it('opens the chat only through a complaint and writes each read to the log', async () => {
    const { deps, store } = setup();
    const filed = await fileComplaint(deps, 101, input('b1'));
    const id = typeof filed === 'string' ? '' : filed.id;
    expect(await complaintChat(deps, MODERATOR, 'nope')).toBeUndefined();
    expect(await complaintChat(deps, MODERATOR, id)).toEqual([
      { author: publicIdOf(DRIVER), text: 'Salom', at: NOW },
    ]);
    expect(store.reads).toEqual([{ complaintId: id, moderatorId: MODERATOR, at: NOW }]);
    expect((await openComplaint(deps, id))?.status).toBe('in_review');
  });

  it('blocks by the decision, cancels live trips and bookings, tells both, gives the commission back', async () => {
    const { deps, log } = setup();
    const filed = await fileComplaint(deps, DRIVER, input('b1'));
    const id = typeof filed === 'string' ? '' : filed.id;
    expect(await decide(deps, BY_MODERATOR, id, { action: 'block', days: 7, refund: true })).toBe('ok');
    expect(log).toEqual([
      'block 101 7',
      'cancel 101',
      `blocked 101 passenger ${NOW + 7 * DAY_MS}`,
      `refund ${DRIVER} 9000`,
      `resolved ${DRIVER}`,
    ]);
    expect((await deps.store.find(id))?.decision).toBe('block:7:refund');
    expect(await decide(deps, BY_MODERATOR, id, { action: 'warning', refund: false })).toBe(
      'complaints.wrong_status',
    );
    const other = await fileComplaint(deps, 102, input('b2'));
    await decide(deps, BY_MODERATOR, typeof other === 'string' ? '' : other.id, {
      action: 'warning',
      refund: true,
    });
    expect(log.slice(5)).toEqual([`warning ${DRIVER} driver`, 'resolved 102']);
  });

  it('decides a complaint once when two moderators tap at the same moment (docs/65 A4)', async () => {
    const { deps, log } = setup();
    const filed = await fileComplaint(deps, DRIVER, input('b1'));
    const id = typeof filed === 'string' ? '' : filed.id;
    const twice = () => decide(deps, BY_MODERATOR, id, { action: 'block', days: 7, refund: true });
    expect((await Promise.all([twice(), twice()])).sort()).toEqual(['complaints.wrong_status', 'ok']);
    expect(log.filter((line) => /^(refund|block )/.test(line))).toHaveLength(2);
  });
});
