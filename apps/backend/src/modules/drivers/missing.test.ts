import { describe, expect, it } from 'vitest';
import { submitApplication } from './application/apply';
import { applicantPhoto, applicationFor, decideApplication, queue } from './application/moderate';
import { CAR, setup } from './test-kit';

// G89: what the team gets when an application or its person is not there: nothing, never an error
// page or another person's data.
describe('an application that is not there', () => {
  it('shows no draft, no unknown person and no missing photo', async () => {
    const { deps, photos } = setup(null);
    expect(await applicationFor(deps, 1)).toBeUndefined();
    await photos();
    expect(await applicationFor(deps, 1)).toBeUndefined();
    expect(await applicationFor(deps, 2)).toBeUndefined();
    expect(await applicantPhoto(deps, 1, 'avatar')).toBeUndefined();
    expect(await applicantPhoto(deps, 2, 'front')).toBeUndefined();
    expect(await decideApplication(deps, 900, 2, { action: 'approve' })).toEqual({
      ok: false,
      error: 'drivers.not_found',
    });
  });

  it('leaves out of the queue an application whose person deleted the account', async () => {
    const { deps, photos } = setup();
    await photos();
    await submitApplication(deps, 1, CAR);
    const gone = { ...deps, people: { ...deps.people, find: async () => undefined } };
    expect(await queue(gone)).toEqual([]);
    expect(await decideApplication(gone, 900, 1, { action: 'approve' })).toEqual({
      ok: false,
      error: 'drivers.not_found',
    });
  });
});
