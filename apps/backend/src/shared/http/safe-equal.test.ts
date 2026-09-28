import { describe, expect, it } from 'vitest';
import { safeEqual } from './safe-equal';

describe('safeEqual', () => {
  it('accepts only the same secret', () => {
    expect(safeEqual('s3cret', 's3cret')).toBe(true);
    expect(safeEqual('s3creX', 's3cret')).toBe(false);
    expect(safeEqual('s3cret-longer', 's3cret')).toBe(false);
    expect(safeEqual('', 's3cret')).toBe(false);
  });
});
