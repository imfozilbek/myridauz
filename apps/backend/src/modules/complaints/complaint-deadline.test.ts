import { COMPLAIN_DAYS, DAY_MS } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { fileComplaint } from './application/file';
import { input, NOW, setup } from './complaints-test-kit';

describe('a complaint within 7 days of the trip (docs/129, G60)', () => {
  it('takes a complaint on the last day and refuses the day after: then only «Yordam»', async () => {
    const onTime = setup();
    const lastDay = { ...onTime.deps, now: () => NOW + (COMPLAIN_DAYS - 1) * DAY_MS };
    expect(await fileComplaint(lastDay, 101, input('b1'))).toHaveProperty('id');
    const late = setup();
    const after = { ...late.deps, now: () => NOW + COMPLAIN_DAYS * DAY_MS };
    expect(await fileComplaint(after, 101, input('b1'))).toBe('complaints.too_late');
  });
});
