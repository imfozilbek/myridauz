import { describe, expect, it } from 'vitest';
import { closeRequestPosts, postRequest, rememberRequestPost } from './application/request-posts';
import { BUXORO, GROUP, REQUEST, setup } from './request-posts-setup';

// A passenger's request of the Mini App in a direction group (owner, 05.11.2026, docs/223): where it
// goes, which bot writes it, how it closes.
describe('the requests of passengers in a direction group (G94, docs/223)', () => {
  it('the group bot writes it once its key is there and closes it; a post of the poster closes by the poster', async () => {
    const { deps, sent, change } = setup(REQUEST, true, 'group');
    await postRequest(deps, REQUEST.id);
    expect(sent[0]).toMatchObject({ bot: 'group', after: { bot: 'group' } });
    await rememberRequestPost(deps, { requestId: REQUEST.id, chat: GROUP, messageId: 43, bot: 'group' });
    await deps.posts.save({ requestId: REQUEST.id, chat: '-100800', messageId: 44, bot: 'poster' });
    change({ open: false });
    await closeRequestPosts(deps, REQUEST.id);
    expect(sent.slice(1).map(({ bot, edit, remove }) => [bot, edit, remove])).toEqual([
      ['group', 43, undefined],
      ['group', 43, true],
      ['poster', 44, undefined],
      ['poster', 44, true],
    ]);
  });
  it('nothing when the posts are off, the request is closed, or no group is on its route', async () => {
    const off = setup(REQUEST, false);
    await postRequest(off.deps, REQUEST.id);
    const closed = setup({ ...REQUEST, open: false });
    await postRequest(closed.deps, REQUEST.id);
    const elsewhere = setup({ ...REQUEST, to: '1706401' });
    elsewhere.deps = { ...elsewhere.deps, channels: async () => [BUXORO] };
    await postRequest(elsewhere.deps, REQUEST.id);
    expect([...off.sent, ...closed.sent, ...elsewhere.sent]).toEqual([]);
  });
  it('a closed request: its post says so and is deleted, once', async () => {
    const { deps, sent, change } = setup();
    await rememberRequestPost(deps, { requestId: REQUEST.id, chat: GROUP, messageId: 41, bot: 'poster' });
    change({ open: false });
    await closeRequestPosts(deps, REQUEST.id);
    expect(sent.map(({ edit, remove }) => [edit, remove])).toEqual([
      [41, undefined],
      [41, true],
    ]);
    expect(sent[0]?.text).toBe('<b>✅ Йўловчи сўрови ёпилди</b>');
    expect(sent[0]?.markup).toEqual({ inline_keyboard: [] });
    await closeRequestPosts(deps, REQUEST.id);
    expect(sent).toHaveLength(2);
  });
  it('a request that closed while its post waited in the queue closes the post at once', async () => {
    const { deps, sent, change } = setup();
    change({ open: false });
    await rememberRequestPost(deps, { requestId: REQUEST.id, chat: GROUP, messageId: 42, bot: 'poster' });
    expect(sent.map(({ edit, remove }) => [edit, remove])).toEqual([
      [42, undefined],
      [42, true],
    ]);
  });
});
