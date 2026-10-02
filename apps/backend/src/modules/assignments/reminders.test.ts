import { tashkentDayStart } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { testD1 } from '../../test-d1';
import { remindWaiting, type ReminderDeps, type Waiting } from './application/remind';
import { d1Assignments } from './infrastructure/d1-assignments';
import { createMemoryAssignments } from './infrastructure/memory-assignments';

const DAY = '2026-10-02';
const at = (hour: number, minute = 0) => tashkentDayStart(DAY) + (hour * 60 + minute) * 60 * 1000;
const RULES = { hours: { from: 7, to: 23 }, remindMinutes: 30, ownerMinutes: 50 };
const MODERATOR = 950;

function setup(store = createMemoryAssignments()) {
  let now = at(10);
  const sent: string[] = [];
  const queue: Waiting[] = [];
  const deps: ReminderDeps = {
    store,
    rules: RULES,
    now: () => now,
    waiting: async () => queue,
    toModerator: async (id, application) => void sent.push(`moderator ${id}: ${application.name}`),
    toOwners: async (application, id) => void sent.push(`owners: ${application.name}, ${id}`),
  };
  const send = (userId: number, submittedAt: number) => {
    queue.splice(0, queue.length, { userId, publicId: `p${userId}`, name: 'Jasur', submittedAt });
    const assignment = { kind: 'application' as const, subjectId: userId, day: DAY, assigneeId: MODERATOR };
    return store.save({ ...assignment, at: submittedAt, operator: 1 });
  };
  const tick = async (ms: number) => {
    now = ms;
    await remindWaiting(deps);
  };
  return { sent, send, tick };
}

describe('the team answers a driver application within the hour (G34)', () => {
  it('reminds its moderator once at 30 minutes, the owners once at 50', async () => {
    const { sent, send, tick } = setup();
    await send(31, at(10));
    for (const minute of [20, 30, 40, 50, 55]) await tick(at(10, minute));
    expect(sent).toEqual([`moderator ${MODERATOR}: Jasur`, `owners: Jasur, ${MODERATOR}`]);
  });

  it('sends nothing at night and counts a night application from 7:00', async () => {
    const { sent, send, tick } = setup();
    await send(32, at(2));
    await tick(at(6, 50));
    expect(sent).toEqual([]);
    await tick(at(7, 30));
    expect(sent).toEqual([`moderator ${MODERATOR}: Jasur`]);
  });

  it('an application sent again starts its own reminders; D1 remembers what was sent', async () => {
    const { sent, send, tick } = setup(d1Assignments(testD1()));
    await send(33, at(9));
    await tick(at(9, 30));
    await tick(at(9, 35));
    await send(33, at(11));
    await tick(at(11, 30));
    expect(sent).toEqual([`moderator ${MODERATOR}: Jasur`, `moderator ${MODERATOR}: Jasur`]);
  });
});
