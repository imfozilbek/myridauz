import { describe, expect, it } from 'vitest';
import { fileComplaint } from './application/file';
import { complaintQueue, decide } from './application/moderate';
import { myNotes } from './application/my-notes';
import { BY_MODERATOR, DRIVER, input, NOW, setup } from './complaints-test-kit';

// What a person sees of the complaints about them in the Mini App (G75, docs/158 З): out of the
// search until the team decides, and a warning of the team; never who complained.
describe('the notes of a person about the complaints', () => {
  it('says the person is out of the search while 3 complaints wait', async () => {
    const { deps } = setup();
    expect(await myNotes(deps, DRIVER)).toEqual({ hidden: false, warnedAt: null });
    for (const n of [1, 2, 3]) await fileComplaint(deps, 100 + n, input(`b${n}`));
    expect(await myNotes(deps, DRIVER)).toEqual({ hidden: true, warnedAt: null });
  });

  it('keeps the warning of the team with its day', async () => {
    const { deps } = setup();
    await fileComplaint(deps, 101, input('b1'));
    const [view] = await complaintQueue(deps);
    await decide(deps, BY_MODERATOR, view?.id ?? '', { action: 'warning', refund: false });
    expect(await myNotes(deps, DRIVER)).toEqual({ hidden: false, warnedAt: NOW });
  });
});
