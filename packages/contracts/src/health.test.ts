import { describe, expect, it } from 'vitest';
import { healthResponseSchema } from './health';

describe('healthResponseSchema', () => {
  it('accepts a valid response', () => {
    const response = { status: 'ok', time: '2026-09-28T10:00:00.000Z' };
    expect(healthResponseSchema.parse(response)).toEqual(response);
  });

  it('rejects a response without time', () => {
    expect(healthResponseSchema.safeParse({ status: 'ok' }).success).toBe(false);
  });
});
