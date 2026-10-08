import { describe, expect, it } from 'vitest';
import { fileComplaint } from './application/file';
import { complaintQueue, decide, openComplaint } from './application/moderate';
import { fileNoShow, noShowRefunds } from './application/no-show';
import { answerRefund } from './application/refund';
import { BY_MODERATOR, DRIVER, input, NOW, setup } from './complaints-test-kit';

const BY_OWNER = { id: 900, owner: true };

// «Kelmadi» of the driver about the passenger of b1, decided by a moderator with a refund.
async function proposed() {
  const kit = setup();
  const filed = await fileComplaint(kit.deps, DRIVER, input('b1'));
  const id = typeof filed === 'string' ? '' : filed.id;
  expect(await decide(kit.deps, BY_MODERATOR, id, { action: 'warning', refund: true })).toBe('ok');
  return { ...kit, id };
}

describe('the refund of a no-show: a moderator proposes, the owner confirms (docs/35)', () => {
  it('the decision moves no money and keeps the case in the queue for the owner', async () => {
    const { deps, log, id } = await proposed();
    expect(log.some((line) => line.startsWith('refund'))).toBe(false);
    expect((await deps.store.find(id))?.decision).toBe('warning:refund');
    const [waiting] = await complaintQueue(deps);
    expect(waiting).toMatchObject({ id, status: 'resolved', refund: { state: 'proposed', amount: 9000 } });
  });

  it('only the owner confirms, once; the commission goes back to the driver', async () => {
    const { deps, log, id } = await proposed();
    expect(await answerRefund(deps, BY_MODERATOR, id, 'confirm')).toBe('auth.not_owner');
    expect(await answerRefund(deps, BY_OWNER, id, 'confirm')).toBe('ok');
    expect(await answerRefund(deps, BY_OWNER, id, 'confirm')).toBe('complaints.wrong_status');
    expect(log.filter((line) => line.startsWith('refund'))).toEqual([`refund ${DRIVER} b1`]);
    expect((await openComplaint(deps, id))?.refund).toEqual({ state: 'confirmed', amount: 9000 });
    expect(await deps.store.find(id)).toMatchObject({
      refund: { state: 'confirmed', proposedBy: BY_MODERATOR.id, decidedBy: BY_OWNER.id, decidedAt: NOW },
    });
    expect(await complaintQueue(deps)).toEqual([]);
  });

  it('two owner taps at the same moment give the money back once (docs/65 A4)', async () => {
    const { deps, log, id } = await proposed();
    const tap = () => answerRefund(deps, BY_OWNER, id, 'confirm');
    expect((await Promise.all([tap(), tap()])).sort()).toEqual(['complaints.wrong_status', 'ok']);
    expect(log.filter((line) => line.startsWith('refund'))).toHaveLength(1);
  });

  it('a rejected refund moves no money', async () => {
    const { deps, log, id } = await proposed();
    expect(await answerRefund(deps, BY_OWNER, id, 'reject')).toBe('ok');
    expect(await answerRefund(deps, BY_OWNER, id, 'confirm')).toBe('complaints.wrong_status');
    expect(log.some((line) => line.startsWith('refund'))).toBe(false);
    expect((await openComplaint(deps, id))?.refund).toEqual({ state: 'rejected', amount: 9000 });
  });

  it('nothing to confirm without a proposal', async () => {
    const { deps } = setup();
    const filed = await fileComplaint(deps, DRIVER, input('b2'));
    const id = typeof filed === 'string' ? '' : filed.id;
    expect(await answerRefund(deps, BY_OWNER, id, 'confirm')).toBe('complaints.wrong_status');
    expect(await answerRefund(deps, BY_OWNER, 'nope', 'confirm')).toBe('complaints.not_found');
    // A passenger says the driver did not come: no commission of the driver to give back.
    const passenger = await fileComplaint(deps, 103, input('b3'));
    const other = typeof passenger === 'string' ? '' : passenger.id;
    await decide(deps, BY_MODERATOR, other, { action: 'warning', refund: true });
    expect((await deps.store.find(other))?.refund).toBeNull();
  });
});

describe('«Kelmadi» puts the case into the queue of the team (docs/124 В)', () => {
  it('files one no_show complaint of the driver per ride', async () => {
    const { deps } = setup();
    await fileNoShow(deps, DRIVER, 'b1');
    await fileNoShow(deps, DRIVER, 'b1');
    const queue = await complaintQueue(deps);
    expect(queue.map((known) => [known.reason, known.author.role, known.against.role])).toEqual([
      ['no_show', 'driver', 'passenger'],
    ]);
  });

  it('tells the driver the state of the refund of each ride', async () => {
    const { deps, id } = await proposed();
    expect(await noShowRefunds(deps, DRIVER, ['b1', 'b2'])).toEqual(new Map([['b1', 'proposed']]));
    await answerRefund(deps, BY_OWNER, id, 'confirm');
    expect(await noShowRefunds(deps, DRIVER, ['b1'])).toEqual(new Map([['b1', 'confirmed']]));
  });
});
