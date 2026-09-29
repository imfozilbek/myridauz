import type { Trip } from '@platform/contracts';
import type { NotificationJob } from '../../notifications';

// The message id of each channel post of a trip, to edit it later (docs/15).
export type ChannelPost = { readonly tripId: string; readonly channel: string; readonly messageId: number };
export type ChannelPostStore = {
  save(post: ChannelPost, departAt: number): Promise<void>;
  byTrip(tripId: string): Promise<ChannelPost[]>;
  // Trips that left by now while their posts still offer seats; closed ones once edited.
  departed(now: number): Promise<string[]>;
  close(tripId: string): Promise<void>;
};

type Place = { readonly name: string; readonly parentId: string | null };

export type ChannelsDeps = {
  // Autoposting starts only when the owner switches it on (docs/33, public action).
  readonly enabled: boolean;
  readonly channels: Readonly<Record<string, string>>;
  readonly places: () => Promise<ReadonlyMap<string, Place>>;
  readonly trip: (id: string) => Promise<Trip | undefined>;
  readonly posts: ChannelPostStore;
  readonly render: (
    trip: Trip,
    places: ReadonlyMap<string, Place>,
    now: number,
  ) => { text: string; markup: object };
  readonly now: () => number;
  readonly send: (jobs: readonly NotificationJob[]) => Promise<void>;
};
