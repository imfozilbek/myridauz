import { describe, expect, it } from 'vitest';
import { call, registerUser } from './test-api';

const PERSON = 91;

// The notes of the complaints reach the Mini App of the person (G75, docs/158 З).
describe('GET /complaints/mine', () => {
  it('answers a registered person with nothing to say yet', async () => {
    await registerUser(PERSON);
    const response = await call('/complaints/mine', PERSON);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ hidden: false, warnedAt: null });
  });
});
