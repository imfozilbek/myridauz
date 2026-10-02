import { describe, expect, it } from 'vitest';
import { createMemorySupportLinks } from './infrastructure/memory-support-links';
import { answerPerson, forwardToTeam, type SupportBot, type SupportDeps } from './application/support';

const TEAM = [7, 8];

function deps() {
  const answers: { bot: SupportBot; chatId: number; text: string }[] = [];
  let messageId = 100;
  const support: SupportDeps = {
    links: createMemorySupportLinks(),
    toTeam: async () => (messageId += 1),
    toWriter: async (bot, chatId, content) => answers.push({ bot, chatId, text: content.text }),
    teamIds: async () => TEAM,
    now: () => 0,
  };
  return { support, answers };
}

describe('support (docs/50)', () => {
  it('sends the answer from the bot the person wrote to', async () => {
    const { support, answers } = deps();
    await forwardToTeam(support, { chatId: 55, bot: 'support' }, { text: 'Savol' });
    // An old copy, made when the admin bot was the support contact: its answer still comes from there.
    await support.links.save(7, 50, { chatId: 66, bot: 'admin' }, 0);
    expect(await answerPerson(support, 8, 102, { text: 'Javob' })).toBe(true);
    expect(await answerPerson(support, 7, 50, { text: 'Eski' })).toBe(true);
    expect(await answerPerson(support, 7, 999, { text: 'Hech kimga' })).toBe(false);
    expect(answers).toEqual([
      { bot: 'support', chatId: 55, text: 'Javob' },
      { bot: 'admin', chatId: 66, text: 'Eski' },
    ]);
  });

  it('skips a team member the copy did not reach', async () => {
    const { support } = deps();
    support.links.save = async () => {
      throw new Error('no link without a copy');
    };
    const failing = { ...support, toTeam: async () => Promise.reject(new Error('blocked the bot')) };
    await expect(forwardToTeam(failing, { chatId: 55, bot: 'support' }, { text: 'Savol' })).resolves.toBe(
      undefined,
    );
  });
});
