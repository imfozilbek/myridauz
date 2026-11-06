import { describe, expect, it } from 'vitest';
import { postRequest } from './application/request-posts';
import { GROUP, PLAIN, REQUEST, setup, TAKE, tile, TURQUOISE } from './request-posts-setup';

// The post of a request as the group's own request cards (owner, 06.11.2026: «максимально похож»,
// docs/223).
describe('the look of a request in a direction group (G94, docs/223)', () => {
  it('goes to the group of its route only, without sound, as the request cards of the group itself', async () => {
    const { deps, sent } = setup(REQUEST, true, 'group');
    await postRequest(deps, REQUEST.id);
    expect(sent).toHaveLength(1);
    const [job] = sent;
    expect(job).toMatchObject({ bot: 'group', chatId: GROUP, html: true, silent: true });
    expect(job?.after).toEqual({ type: 'requestPost', requestId: 'req-1', chat: GROUP, bot: 'group' });
    // Owner, 06.11.2026: «максимально похож» on the mockup of the group's own request card.
    expect(job?.text.split('\n')).toEqual([
      `${tile('301', '🙋')} <b>МАШИНА КЕРАК</b> · Чилонзордан ${TURQUOISE}`,
      `${tile('302', '🏁')} <b>Самарқанд шаҳрига кетаман.</b>`,
      `${tile('303', '🕓')} <b>Эртага керак.</b>`,
      `${tile('304', '🧍')} <b>2 киши бор.</b> · ${tile('305', '💵')} 90\u00a0000`,
    ]);
    // The hand tile is the icon of the button, as the group's own buttons wear theirs.
    expect(job?.markup).toEqual({
      inline_keyboard: [[{ text: 'Йўловчини олиш', url: TAKE, icon_custom_emoji_id: '301' }]],
    });
  });
  it('the poster: the tiles in the text, the hand in the words of the button, no icon (Premium only)', async () => {
    const { deps, sent } = setup();
    await postRequest(deps, REQUEST.id);
    expect(sent[0]?.text.split('\n')[0]).toBe(
      `${tile('301', '🙋')} <b>МАШИНА КЕРАК</b> · Чилонзордан ${TURQUOISE}`,
    );
    expect(sent[0]?.markup).toEqual({ inline_keyboard: [[{ text: '🙋 Йўловчини олиш', url: TAKE }]] });
  });

  it('a brand without tiles: the plain emoji, the hand in the words of the button', async () => {
    const { deps, sent } = setup(REQUEST, true, 'poster', PLAIN);
    await postRequest(deps, REQUEST.id);
    expect(sent[0]?.text.split('\n')[0]).toBe(`🙋 <b>МАШИНА КЕРАК</b> · Чилонзордан ${TURQUOISE}`);
    expect(sent[0]?.markup).toEqual({ inline_keyboard: [[{ text: '🙋 Йўловчини олиш', url: TAKE }]] });
  });
  it('the day as the group says it: «Bugun», «Ertaga», later the date', async () => {
    const lines = await Promise.all(
      ['2026-10-01', '2026-10-02', '2026-10-05'].map(async (date) => {
        const { deps, sent } = setup({ ...REQUEST, date });
        await postRequest(deps, REQUEST.id);
        return sent[0]?.text.split('\n')[2];
      }),
    );
    expect(lines).toEqual([
      `${tile('303', '🕓')} <b>Бугун керак.</b>`,
      `${tile('303', '🕓')} <b>Эртага керак.</b>`,
      `${tile('303', '🕓')} <b>5-октябр керак.</b>`,
    ]);
  });
  it('4 people or the whole car: «BOʻSH MASHINA KERAK»', async () => {
    const { deps, sent } = setup({ ...REQUEST, wholeCar: true });
    await postRequest(deps, REQUEST.id);
    expect(sent[0]?.text).toContain(`${tile('301', '🙋')} <b>БЎШ МАШИНА КЕРАК</b> · Чилонзордан`);
  });
});
