import { describe, expect, it } from 'vitest';
import { requestBoard } from './application/board';
import { setup } from './requests-test-kit';

// «Xabar bering» of an empty board (G78 sheet 3): the driver hears of the new requests on a direction
// of the board, by regions, as the board reads them; never twice for the same direction.
describe('the route «Xabar bering» of the board subscribes to (G78 sheet 3)', () => {
  it('offers the regions of the first direction of the driver', async () => {
    const { deps, directions } = setup();
    directions([{ from: '1726273', to: '1718401' }]);
    const board = await requestBoard(deps, 9, {});
    expect(board.ok && board.value.notify).toEqual({ from: '1726', to: '1718' });
  });

  it('skips a direction a subscription covers, and offers nothing once all are covered', async () => {
    const { deps, directions, subscribe } = setup();
    directions([
      { from: '1726273', to: '1718401' },
      { from: '1718401', to: '1726273' },
    ]);
    subscribe([{ from: '1726', to: '1718' }]);
    const board = await requestBoard(deps, 9, {});
    expect(board.ok && board.value.notify).toEqual({ from: '1718', to: '1726' });
    subscribe([
      { from: '1726', to: '1718' },
      { from: '1718401', to: '1726' },
    ]);
    const again = await requestBoard(deps, 9, {});
    expect(again.ok && again.value.notify).toBeNull();
  });

  it('offers the route of a link as it is', async () => {
    const { deps } = setup();
    const board = await requestBoard(deps, 9, { from: '1726273', to: '1718401' });
    expect(board.ok && board.value.notify).toEqual({ from: '1726273', to: '1718401' });
  });
});
