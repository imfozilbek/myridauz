import { describe, expect, it } from 'vitest';
import { closeDeparted, refreshPosts, rememberPost } from './application/channels';
import { setup } from './channels-kit';
import { TRIP } from './channels-fixtures';

// The life of the posts of a trip (G68, docs/122, mockup g68/5 «Post hayoti»).
describe('the life of the posts of a trip (G68)', () => {
  it('a cancelled trip says so in its posts, then the posts are deleted (G68)', async () => {
    const { deps, sent, change } = setup();
    await rememberPost(deps, { tripId: 'trip-1', channel: 'ch_samarqand', messageId: 7 }, 'active 3 true');
    change({ status: 'cancelled' });
    await refreshPosts(deps, 'trip-1');
    expect(sent.map((job) => [job.edit, job.remove ?? false])).toEqual([
      [7, false],
      [7, true],
    ]);
    expect(sent[0]?.text).toContain('Safar bekor qilindi');
  });

  it('a trip that arrived edits its closed posts once more: «Yetib bordi» (G68)', async () => {
    const { deps, sent, change, later } = setup();
    await rememberPost(deps, { tripId: 'trip-1', channel: 'ch_samarqand', messageId: 7 }, 'active 3 true');
    later(TRIP.departAt);
    await closeDeparted(deps);
    change({ status: 'completed', arrivedAt: TRIP.departAt });
    await refreshPosts(deps, 'trip-1');
    expect(sent.map((job) => job.text.split('\n')[0])).toEqual([
      '<b>🚗 Yoʻlga chiqdi</b>',
      '<b>🏁 Yetib bordi</b>',
    ]);
  });
});
