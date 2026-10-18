import { describe, expect, it } from 'vitest';
import type { Bindings } from '../../env';
import { fullScans, testD1 } from '../../test-d1';
import { blocksOf, forgetBotBlocks } from './infrastructure/bot-blocks';

const PERSON = 41;

// «Blocked the bot» on SQLite with the real migrations (G46, migration 0078).
describe('the marks of people who blocked a bot', () => {
  it('keeps a mark per bot until /start, forgets it with the account, never scans', async () => {
    const db = testD1();
    const env = { DB: db } as unknown as Bindings;
    const blocks = blocksOf(env);
    await blocks.mark('passenger', PERSON, 1);
    await blocks.mark('passenger', PERSON, 2);
    expect(await blocks.has('passenger', PERSON)).toBe(true);
    expect(await blocks.has('driver', PERSON)).toBe(false);
    await blocks.clear('passenger', PERSON);
    expect(await blocks.has('passenger', PERSON)).toBe(false);
    await blocks.mark('driver', PERSON, 3);
    await forgetBotBlocks(env, PERSON);
    expect(await blocks.has('driver', PERSON)).toBe(false);
    expect(fullScans(db).filter((scan) => scan.includes('bot_blocks'))).toEqual([]);
  });
});
