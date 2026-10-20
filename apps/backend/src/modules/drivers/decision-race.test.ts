import { describe, expect, it } from 'vitest';
import { submitApplication } from './application/apply';
import { decideApplication } from './application/moderate';
import { CAR, setup } from './test-kit';

// G89 M5: a double tap or two members at once decide an application once: one bonus, one answer.
describe('two decisions on one application at the same moment', () => {
  it('lets one win; the other hears the application is decided already', async () => {
    const { deps, log, photos } = setup();
    await photos();
    await submitApplication(deps, 1, CAR);
    const taps = await Promise.all([
      decideApplication(deps, 900, 1, { action: 'approve' }),
      decideApplication(deps, 901, 1, { action: 'approve' }),
      decideApplication(deps, 902, 1, { action: 'reject', reasons: ['fake_profile'] }),
    ]);
    expect(taps.filter((tap) => tap.ok)).toHaveLength(1);
    expect(taps.filter((tap) => !tap.ok).map((tap) => !tap.ok && tap.error)).toEqual([
      'drivers.wrong_status',
      'drivers.wrong_status',
    ]);
    expect(log.filter((line) => line.startsWith('decided:'))).toHaveLength(1);
  });
});
