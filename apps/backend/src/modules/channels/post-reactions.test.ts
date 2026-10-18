import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { countReactions } from './application/post-reactions';
import { d1PostReactions } from './infrastructure/post-reactions';

const NOW = Date.parse('2026-10-18T05:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const PRIVATE = '-1004328825984';
const TEAM = '@ch_kitob';
const TEAM_ID = -1001234567890;

async function setup() {
  const db = testD1();
  await db.exec(
    `INSERT INTO channel_posts (trip_id, channel, message_id, depart_at) VALUES ('t1', '${PRIVATE}', 10, ${NOW}), ('t2', '${PRIVATE}', 11, ${NOW}), ('t3', '${TEAM}', 7, ${NOW})`,
  );
  const reactions = d1PostReactions(db);
  const heard = (chatId: number, messageId: number, totals: number[], at = NOW, username?: string) =>
    countReactions(reactions, { chatId, username: username ?? null, messageId, totals, at });
  return { db, reactions, heard };
}

// G87 V6 (docs/176): the reactions on the posts of trips, only numbers; the best post of each channel.
describe('the reactions on the posts of the channels', () => {
  it('keeps the sum of every kind of reaction, the latest count wins', async () => {
    const { reactions, heard } = await setup();
    await heard(Number(PRIVATE), 10, [3, 2]);
    await heard(Number(PRIVATE), 11, [4]);
    await heard(Number(PRIVATE), 11, [4, 3], NOW + 1);
    // A channel of the team is kept by its public name.
    await heard(TEAM_ID, 7, [1], NOW, 'ch_kitob');
    expect(await reactions.top(NOW - DAY)).toEqual(
      new Map([
        [PRIVATE, { messageId: 11, reactions: 7 }],
        [TEAM, { messageId: 7, reactions: 1 }],
      ]),
    );
  });

  it('keeps nothing of a post that is no trip, forgets an old week, without a full scan', async () => {
    const { db, reactions, heard } = await setup();
    await heard(Number(PRIVATE), 99, [5]);
    await heard(Number(PRIVATE), 10, [2], NOW - 8 * DAY);
    expect(await reactions.top(NOW - 7 * DAY)).toEqual(new Map());
    expect(fullScans(db)).toEqual([]);
  });
});
