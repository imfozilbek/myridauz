import { describe, expect, it } from 'vitest';
import { fineCell, nearCells, nearFineCells, placeCell } from './place-cell';

describe('the cells of the map for «near» (G23, G24)', () => {
  it('puts a point into a cell of a quarter degree', () => {
    expect(placeCell({ lat: 41.3111, lng: 69.2797 })).toBe('165x277');
    expect(placeCell({ lat: 41.2499, lng: 69.2501 })).toBe('164x277');
  });

  it('takes the cell of a point and the eight around it', () => {
    const cells = nearCells({ lat: 41.3111, lng: 69.2797 });
    expect(cells).toHaveLength(9);
    expect(cells).toContain('165x277');
    expect(cells).toContain('164x276');
    expect(cells).toContain('166x278');
  });

  it('puts a point into a cell of about 1 km for the name of a point (G24)', () => {
    expect(fineCell({ lat: 41.3111, lng: 69.2797 })).toBe('4131x6927');
    const cells = nearFineCells({ lat: 41.3111, lng: 69.2797 });
    expect(cells).toHaveLength(9);
    expect(cells).toContain('4130x6926');
    expect(cells).toContain('4132x6928');
  });
});
