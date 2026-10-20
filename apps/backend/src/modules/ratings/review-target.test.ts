import { describe, expect, it } from 'vitest';
import { rate, reviewTarget } from './application/rate';
import { DRIVER, review, setup } from './ratings-test-kit';
import { publicIdOf } from '../../test-people';

// G89: the review screen names the other side of one's own ride and shows one's own review; a ride
// of nobody or of other people opens nothing (docs/24).
describe('the review screen', () => {
  it('shows whom each side rates and the own review', async () => {
    const { deps } = setup();
    expect(await reviewTarget(deps, 101, 'b1')).toEqual({
      rateeId: publicIdOf(DRIVER),
      rateeName: 'Jasur',
      rateeRole: 'driver',
      mine: null,
    });
    await rate(deps, DRIVER, { ...review('b1', 4, 'Yaxshi'), tags: ['polite'] });
    expect(await reviewTarget(deps, DRIVER, 'b1')).toMatchObject({
      rateeName: 'P101',
      rateeRole: 'passenger',
      mine: { stars: 4, text: 'Yaxshi' },
    });
  });

  it('opens nothing for a ride of nobody or of other people', async () => {
    const { deps } = setup();
    expect(await reviewTarget(deps, 101, 'none')).toBe('reviews.not_found');
    expect(await reviewTarget(deps, 999, 'b1')).toBe('reviews.not_found');
  });

  it('names nobody when the other side deleted the account', async () => {
    const { deps } = setup();
    const gone = {
      ...deps,
      names: async () => new Map<number, string>(),
      people: { ...deps.people, publicId: async () => undefined },
    };
    expect(await reviewTarget(gone, 101, 'b1')).toMatchObject({ rateeId: '', rateeName: '' });
  });
});
