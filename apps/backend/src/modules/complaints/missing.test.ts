import { describe, expect, it } from 'vitest';
import { fileComplaint } from './application/file';
import { complaintChat, decide, openComplaint } from './application/moderate';
import { BY_MODERATOR, DRIVER, input, MODERATOR, setup } from './complaints-test-kit';

const idOf = (filed: Awaited<ReturnType<typeof fileComplaint>>) =>
  typeof filed === 'string' ? '' : filed.id;

// G89: the team opens nothing that is not there, a deleted side shows no id, and only the owner
// blocks a member of the team (docs/17).
describe('a complaint that is not there or about the team', () => {
  it('opens, reads and decides no unknown complaint', async () => {
    const { deps } = setup();
    expect(await openComplaint(deps, 'none')).toBeUndefined();
    expect(await complaintChat(deps, MODERATOR, 'none')).toBeUndefined();
    expect(await decide(deps, BY_MODERATOR, 'none', { action: 'none', refund: false })).toBe(
      'complaints.not_found',
    );
  });

  it('shows the chat of a deleted side without an id, and the lines of the system without an author', async () => {
    const { deps } = setup();
    const id = idOf(await fileComplaint(deps, DRIVER, input('b1')));
    const lines = [
      { author: DRIVER, text: 'Salom', at: 1 },
      { author: null, text: 'booked', at: 2 },
    ];
    const gone = {
      ...deps,
      chat: async () => lines,
      people: { ...deps.people, find: async () => undefined },
    };
    expect((await complaintChat(gone, MODERATOR, id))?.map((line) => line.author)).toEqual(['', null]);
  });

  it('lets only the owner block a member of the team', async () => {
    const { deps } = setup();
    const id = idOf(await fileComplaint(deps, DRIVER, input('b2')));
    const block = { action: 'block' as const, days: 7 as const, refund: false };
    expect(await decide(deps, BY_MODERATOR, id, block)).toBe('auth.not_owner');
    expect(await decide(deps, { id: 901, owner: true }, id, block)).toBe('ok');
  });
});
