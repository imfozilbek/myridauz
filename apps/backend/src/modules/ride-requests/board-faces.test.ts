import { describe, expect, it } from 'vitest';
import { requestBoard } from './application/board';
import { myRequests, publishRequest } from './application/use-cases';
import { setup } from './requests-test-kit';

const PASSENGER = 1;
const DRIVER = 9;

// Prod 21.11.2026: users.avatar_hidden 8 times on «Yoʻlovchilar soʻrovlari». The Mini App of a driver
// shows no face of a passenger, so the board says the passenger has none and no photo is asked.
describe('the board of a driver asks for no face of a passenger', () => {
  it('gives the driver no photo, the passenger still sees the own one', async () => {
    const kit = setup();
    const people = {
      find: async (userId: number) => {
        const person = await kit.deps.people.find(userId);
        return person && { ...person, avatarKey: 'avatars/1', avatarShown: true };
      },
    };
    const deps = { ...kit.deps, people };
    kit.directions([{ from: '1726', to: '1718' }]);
    await publishRequest(deps, PASSENGER, kit.request);
    const board = await requestBoard(deps, DRIVER, { date: kit.request.date });
    expect(board.ok && board.value.others.map((one) => one.passenger.hasAvatar)).toEqual([false]);
    expect((await myRequests(deps, PASSENGER)).map((one) => one.passenger.hasAvatar)).toEqual([true]);
  });
});
