import { describe, expect, it } from 'vitest';
import { fileComplaint } from './application/file';
import { decide, openComplaint } from './application/moderate';
import { BY_MODERATOR, input, setup } from './complaints-test-kit';

const idOf = (filed: Awaited<ReturnType<typeof fileComplaint>>) =>
  typeof filed === 'string' ? '' : filed.id;

// The open case of a complaint (docs/17, G45): the past complaints against the same person, why and
// what the team decided, beside the trips and the complaints counted.
describe('the case of a complaint', () => {
  it('shows the past complaints against the same person with the decisions', async () => {
    const { deps } = setup();
    const warned = idOf(await fileComplaint(deps, 101, input('b1')));
    await decide(deps, BY_MODERATOR, warned, { action: 'warning', refund: false });
    const waiting = idOf(await fileComplaint(deps, 102, input('b2', 'unsafe_driving' as never)));
    const first = await openComplaint(deps, warned);
    expect(first?.past.map((one) => [one.id, one.reasons, one.decision])).toEqual([
      [waiting, ['unsafe_driving'], null],
    ]);
    const second = await openComplaint(deps, waiting);
    expect(second?.past.map((one) => [one.id, one.reasons, one.decision])).toEqual([
      [warned, ['no_show'], 'warning'],
    ]);
    expect(second?.against).toMatchObject({ trips: 12, complaints: 2 });
  });
});
