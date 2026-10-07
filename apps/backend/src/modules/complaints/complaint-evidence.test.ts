import { describe, expect, it } from 'vitest';
import { fileComplaint } from './application/file';
import { decide } from './application/moderate';
import { BY_MODERATOR, DRIVER, input, setup } from './complaints-test-kit';

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
