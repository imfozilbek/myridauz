import { describe, expect, it } from 'vitest';
import { fileComplaint } from './application/file';
import { decide } from './application/moderate';
import { BY_MODERATOR, DRIVER, input, setup } from './complaints-test-kit';
import { publicIdOf } from '../../test-people';

const NOTHING = { action: 'none', refund: false } as const;

// A deleted account left the chat of its ride for the complaint only: the decision ends it (docs/58).
function withDeleted(deleted: number) {
  const kit = setup();
  const { find } = kit.deps.people;
  kit.deps.people.find = async (id) => (id === deleted ? undefined : find(id));
  return kit;
}
const idOf = (filed: Awaited<ReturnType<typeof fileComplaint>>) =>
  typeof filed === 'string' ? '' : filed.id;

describe('the chat kept as evidence (G44, docs/58)', () => {
  it('goes after the decision when a side of the ride deleted the account', async () => {
    const { deps, log } = withDeleted(101);
    await decide(deps, BY_MODERATOR, idOf(await fileComplaint(deps, DRIVER, input('b1'))), NOTHING);
    expect(log).toContain('forget b1');
  });

  it('stays while another complaint on the same ride is open', async () => {
    const { deps, log } = withDeleted(101);
    const first = idOf(await fileComplaint(deps, DRIVER, input('b1')));
    const second = idOf(await fileComplaint(deps, 101, input('b1')));
    await decide(deps, BY_MODERATOR, first, NOTHING);
    expect(log).not.toContain('forget b1');
    await decide(deps, BY_MODERATOR, second, NOTHING);
    expect(log).toContain('forget b1');
  });

  it('stays when both sides still have their accounts', async () => {
    const { deps, log } = setup();
    await decide(deps, BY_MODERATOR, idOf(await fileComplaint(deps, 101, input('b1'))), NOTHING);
    expect(log).not.toContain('forget b1');
  });
});

// The phone of a deleted account waits for every complaint against it (docs/58, G89 A2): a block
// decided later still blocks the phone, so a new account with it cannot come back.
describe('the held phone of a deleted account', () => {
  it('is kept until the last open complaint against the person is decided', async () => {
    const { deps, log } = withDeleted(101);
    deps.people.releasePhone = async (id) => void log.push(`release ${id}`);
    const first = idOf(await fileComplaint(deps, DRIVER, input('b1')));
    const second = idOf(await fileComplaint(deps, 102, { ...input('b2'), about: publicIdOf(101) }));
    await decide(deps, BY_MODERATOR, first, NOTHING);
    expect(log).not.toContain('release 101');
    await decide(deps, BY_MODERATOR, second, { action: 'block', days: null, refund: false });
    expect(log).toEqual(expect.arrayContaining(['block 101 null', 'release 101']));
  });
});
