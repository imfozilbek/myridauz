import { loadBrand } from '@platform/brands';
import type { Bindings } from '../../env';
import { chatHistory } from '../chat';
import { notify, notifyTeam } from '../notifications';
import { teamRole } from '../team';
import { peopleOf } from '../users';
import { hiddenFromSearch } from './application/file';
import type { ComplaintsDeps, Ride, Side } from './application/ports';
import { blockRoutes } from './http/block-routes';
import { complaintRoutes } from './http/complaint-routes';
import { botTeller } from './infrastructure/bot-teller';
import { d1Complaints } from './infrastructure/d1-complaints';
import { createMemoryComplaints } from './infrastructure/memory-complaints';

const localComplaints = createMemoryComplaints();

// Rides, trips, cancels and the wallet come from other modules: set by the app (module-events.ts).
type Wiring = {
  ride: (env: Bindings, bookingId: string) => Promise<Ride | undefined>;
  filedRide: (env: Bindings, bookingId: string) => Promise<Ride | undefined>;
  trips: (env: Bindings, userId: number, side: Side) => Promise<number>;
  cancelAll: (env: Bindings, userId: number) => Promise<void>;
  refund: (
    env: Bindings,
    moderatorId: number,
    driverId: number,
    amount: number,
    reason: string,
  ) => Promise<unknown>;
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
    cancelAll: (userId) => cancelAll(env, userId),
    refund: (moderatorId, driverId, amount, reason) => refund(env, moderatorId, driverId, amount, reason),
    tell: botTeller({
      brand: loadBrand(env.BRAND),
      send: (jobs) => notify(env, jobs),
      team: (text, markup) => notifyTeam(env, text, markup),
    }),
    now: Date.now,
    newId: () => crypto.randomUUID(),
  };
};

export const complaintsModule = complaintRoutes(complaintsDeps).route('/', blockRoutes(complaintsDeps));

// Complaints from 3 different people in 30 days: out of the trip search (docs/17).
export const hiddenByComplaints = (env: Bindings, ids: readonly number[]) =>
  hiddenFromSearch(complaintsDeps(env), ids);

// Open complaints by or against a person: an account deletion keeps their chats and the phone (docs/65 A5).
export const openComplaintsOf = async (env: Bindings, userId: number) =>
  (await complaintsDeps(env).store.open()).filter(
    (complaint) => complaint.authorId === userId || complaint.againstId === userId,
  );
