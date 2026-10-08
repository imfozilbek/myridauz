import type { ComplaintStore } from '../application/ports';
import type { ComplaintRecord } from '../domain/complaint';

type ChatRead = { readonly complaintId: string; readonly moderatorId: number; readonly at: number };

// In memory: tests and local runs without D1. The chat reads are kept for the tests of the log.
export function createMemoryComplaints(): ComplaintStore & { readonly reads: ChatRead[] } {
  const complaints = new Map<string, ComplaintRecord>();
  const reads: ChatRead[] = [];
  const all = () => [...complaints.values()];
  return {
    reads,
    save: async (complaint) => void complaints.set(complaint.id, complaint),
    resolve: async (complaint) => {
      if (complaints.get(complaint.id)?.status === 'resolved') return false;
      complaints.set(complaint.id, complaint);
      return true;
    },
    find: async (id) => complaints.get(id),
    ofAuthor: async (authorId, bookingId) =>
      all().find((known) => known.authorId === authorId && known.bookingId === bookingId),
    open: async () => all().filter((known) => known.status !== 'resolved'),
    against: async (ids, since) =>
      all().filter((known) => ids.includes(known.againstId) && known.createdAt >= since),
    countAgainst: async (userId) => all().filter((known) => known.againstId === userId).length,
    logChatRead: async (complaintId, moderatorId, at) => void reads.push({ complaintId, moderatorId, at }),
    refundsProposed: async () => all().filter((known) => known.refund?.state === 'proposed'),
    ofAuthorRides: async (authorId, bookingIds) =>
      all().filter((known) => known.authorId === authorId && bookingIds.includes(known.bookingId)),
    answerRefund: async (complaint) => {
      if (complaints.get(complaint.id)?.refund?.state !== 'proposed') return false;
      complaints.set(complaint.id, complaint);
      return true;
    },
  };
}
