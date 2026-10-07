import { describe, expect, it } from 'vitest';
import { publishRequest, searchRequests } from './application/use-cases';
import { MAN, setup } from './requests-test-kit';

const SEARCH = { from: '1726', to: '1718', date: '2026-10-01' };

describe('the marks of a request (G61, docs/06, docs/118 path 4)', () => {
  it('keeps «Men bilan ayol bor» only of a man with 2 people and more', async () => {
    const { deps, request } = setup();
    const withWoman = { ...request, seats: 2, withWoman: true };
    const man = await publishRequest(deps, MAN, withWoman);
    expect(man.ok && man.value.withWoman).toBe(true);
    // A woman gives the mark by herself; one person brings nobody.
    const woman = await publishRequest(deps, 1, withWoman);
    expect(woman.ok && woman.value.withWoman).toBe(false);
    const alone = await publishRequest(deps, MAN, { ...withWoman, seats: 1, date: '2026-10-02' });
    expect(alone.ok && alone.value.withWoman).toBe(false);
  });

  it('shows «Boʻsh salon kerak» to drivers', async () => {
    const { deps, request } = setup();
    await publishRequest(deps, 1, { ...request, wholeCar: true });
    const found = await searchRequests(deps, 9, SEARCH);
    expect(found.ok && found.value.map((item) => item.wholeCar)).toEqual([true]);
  });
});
