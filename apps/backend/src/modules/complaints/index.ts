import type { Bindings } from '../../env';
import { chatHistory, forgetChat } from '../chat';
import { notify } from '../notifications';
import { showQueue } from '../team-queue';
import { teamRole } from '../team';
import { peopleOf } from '../users';
import { hiddenFromSearch } from './application/file';
import { fileNoShow, noShowRefunds } from './application/no-show';
import type { ComplaintsDeps, Ride, Side } from './application/ports';
import { blockRoutes } from './http/block-routes';
import { complaintRoutes } from './http/complaint-routes';
import { refundRoutes } from './http/refund-routes';
import { botTeller } from './infrastructure/bot-teller';
import { d1Complaints } from './infrastructure/d1-complaints';
import { createMemoryComplaints } from './infrastructure/memory-complaints';
import { brandOf } from '../../shared/brand/brand-of';

const localComplaints = createMemoryComplaints();

// Rides, trips, cancels and the wallet come from other modules: set by the app (module-events.ts).
type Wiring = {
  ride: (env: Bindings, bookingId: string) => Promise<Ride | undefined>;
  filedRide: (env: Bindings, bookingId: string) => Promise<Ride | undefined>;
  trips: (env: Bindings, userId: number, side: Side) => Promise<number>;
  cancelAll: (env: Bindings, userId: number) => Promise<void>;
  refund: (env: Bindings, ownerId: number, driverId: number, bookingId: string) => Promise<'ok' | 'nothing'>;
};
let wiring: Wiring | undefined;
export const wireComplaints = (next: Wiring) => void (wiring = next);

const complaintsDeps = (env: Bindings): ComplaintsDeps => {
  if (!wiring) throw new Error('complaints.not_wired');
  const { ride, filedRide, trips, cancelAll, refund } = wiring;
  return {
    store: env.DB ? d1Complaints(env.DB) : localComplaints,
    ride: (id) => ride(env, id),
    filedRide: (id) => filedRide(env, id),
    people: peopleOf(env),
    isTeam: async (userId) => (await teamRole(env, userId)) !== null,
    trips: (userId, side) => trips(env, userId, side),
    chat: (key) => chatHistory(env, key),
    forgetChat: (key) => forgetChat(env, key),
    cancelAll: (userId) => cancelAll(env, userId),
    refund: (ownerId, driverId, bookingId) => refund(env, ownerId, driverId, bookingId),
    tell: botTeller({
      brand: brandOf(env),
      send: (jobs) => notify(env, jobs),
      queue: (news) => showQueue(env, news),
    }),
    limits: brandOf(env).complaints,
    now: Date.now,
    newId: () => crypto.randomUUID(),
  };
};

// The open complaints for «Navbat» of the team (G68): whose and since when.
export async function waitingComplaints(env: Bindings) {
  const deps = complaintsDeps(env);
  const name = async (id: number) => (await deps.people.find(id))?.firstName ?? '';
  return Promise.all(
    (await deps.store.open()).map(async (complaint) => ({
      id: complaint.id,
      name: await name(complaint.authorId),
      against: await name(complaint.againstId),
      reason: complaint.reason,
      since: complaint.createdAt,
    })),
  );
}

// The complaints against a person, for «Odamlar» of the owner (G75).
export const complaintsAgainst = (env: Bindings, userId: number) =>
  complaintsDeps(env).store.countAgainst(userId);

export const complaintsModule = complaintRoutes(complaintsDeps)
  .route('/', blockRoutes(complaintsDeps))
  .route('/', refundRoutes(complaintsDeps));

// «Kelmadi» of the driver and the refunds the driver sees (G63, docs/35).
export const fileNoShowOf = (env: Bindings, driverId: number, bookingId: string) =>
  fileNoShow(complaintsDeps(env), driverId, bookingId);
export const noShowRefundsOf = (env: Bindings, driverId: number, bookingIds: readonly string[]) =>
  noShowRefunds(complaintsDeps(env), driverId, bookingIds);

// Complaints from 3 different people in 30 days: out of the trip search (docs/17).
export const hiddenByComplaints = (env: Bindings, ids: readonly number[]) =>
  hiddenFromSearch(complaintsDeps(env), ids);

// Open complaints by or against a person: an account deletion keeps their chats and the phone (docs/65 A5).
export const openComplaintsOf = async (env: Bindings, userId: number) =>
  (await complaintsDeps(env).store.open()).filter(
    (complaint) => complaint.authorId === userId || complaint.againstId === userId,
  );

// The rides of open complaints keep their points until the decision (docs/69).
export const bookingsUnderComplaint = async (env: Bindings) =>
  new Set((await complaintsDeps(env).store.open()).map((complaint) => complaint.bookingId));
