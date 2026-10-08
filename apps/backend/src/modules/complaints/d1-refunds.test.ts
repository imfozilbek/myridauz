import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import type { ComplaintRecord } from './domain/complaint';
import { d1Complaints } from './infrastructure/d1-complaints';

const NOW = Date.parse('2026-10-05T12:00:00Z');
const complaint: ComplaintRecord = {
  id: 'c1',
  authorId: 1,
  againstId: 10,
  bookingId: 'b1',
  reason: 'no_show',
  comment: '',
  status: 'new',
  decision: null,
  decidedBy: null,
  createdAt: NOW,
  decidedAt: null,
  refund: null,
};
const proposal = {
  state: 'proposed',
  proposedBy: 905,
  proposedAt: NOW + 1,
  decidedBy: null,
  decidedAt: null,
} as const;

// The refund of a no-show in D1 (G63, docs/35): proposed with the decision, answered once by the owner.
describe('the refunds of no-shows in D1', () => {
  it('writes the proposal with the decision and keeps it on a later save', async () => {
    const db = testD1();
    const store = d1Complaints(db);
    await store.save(complaint);
    const decided = {
      ...complaint,
      status: 'resolved' as const,
      decision: 'warning:refund',
      decidedBy: 905,
      decidedAt: NOW + 1,
      refund: proposal,
    };
    expect(await store.resolve(decided)).toBe(true);
    expect(await store.find('c1')).toEqual(decided);
    await store.save(decided);
    expect(await store.refundsProposed()).toEqual([decided]);
    expect(await store.ofAuthorRides(1, ['b1', 'b2'])).toEqual([decided]);
    expect(await store.ofAuthorRides(10, ['b1'])).toEqual([]);
    const answer = {
      ...decided,
      refund: { ...proposal, state: 'confirmed' as const, decidedBy: 900, decidedAt: NOW + 2 },
    };
    expect(await store.answerRefund(answer)).toBe(true);
    expect(await store.answerRefund(answer)).toBe(false);
    expect(await store.find('c1')).toEqual(answer);
    expect(await store.refundsProposed()).toEqual([]);
    expect(fullScans(db)).toEqual([]);
  });
});
