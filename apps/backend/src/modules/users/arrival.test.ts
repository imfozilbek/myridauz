import type { Arrival } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { createMemoryImages } from '../../shared/storage/memory-images';
import type { UsersDeps } from './application/ports';
import { register } from './application/register';
import { createMemoryUsers } from './infrastructure/memory-stores';
import { noFaces } from './test-kit';

const NOW = 1_000_000;
const ali = { id: 1, firstName: 'Ali', isAdmin: false };
const input = { firstName: 'Ali', gender: 'male' as const, contact: { userId: 1, phone: '998901234567' } };
const came: Arrival = { source: 'trip', via: 'ch-yol-samarqand', client: 'android 9.6 chrome 120' };

function setup() {
  const kept: [number, Arrival, number][] = [];
  const users = {
    ...createMemoryUsers(),
    arrived: async (id: number, arrival: Arrival, at: number) => {
      kept.push([id, arrival, at]);
    },
  };
  const deps: UsersDeps = {
    users,
    avatars: createMemoryImages(),
    trips: { relation: async () => 'none' },
    ...noFaces,
    now: () => NOW,
    newId: () => 'id1',
  };
  return { deps, kept };
}

describe('the first touch (G55, docs/116)', () => {
  it('keeps where the person came from and on what, once at the registration', async () => {
    const { deps, kept } = setup();
    expect((await register(deps, ali, { ...input, came })).ok).toBe(true);
    expect(kept).toEqual([[1, came, NOW]]);
    expect((await register(deps, ali, { ...input, came })).ok).toBe(false);
    expect(kept).toHaveLength(1);
  });

  it('registers as before when the app says nothing of it', async () => {
    const { deps, kept } = setup();
    expect((await register(deps, ali, input)).ok).toBe(true);
    expect(kept).toEqual([]);
  });
});
