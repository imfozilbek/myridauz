import { describe, expect, it } from 'vitest';
import { operatorNumber, steadyOperator } from './operator';

describe('the operator number (docs/92)', () => {
  it('is 1 … 200 for any random', () => {
    expect([0, 0.5, 0.999999].map(operatorNumber)).toEqual([1, 101, 200]);
  });

  it('is steady for a person without a numbered question', () => {
    expect(steadyOperator(900231)).toBe(steadyOperator(900231));
    expect(steadyOperator(200)).toBe(1);
  });
});
