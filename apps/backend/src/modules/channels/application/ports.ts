import type { Trip } from '@platform/contracts';
import type { NotificationJob } from '../../notifications';
import type { ChannelCoverage } from '../domain/route-channels';

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
  // The 13 region channels of the brand and the channels the team added (docs/63).
  readonly channels: () => Promise<readonly ChannelCoverage[]>;
  readonly places: () => Promise<ReadonlyMap<string, Place>>;
  readonly trip: (id: string) => Promise<Trip | undefined>;
  readonly posts: ChannelPostStore;
  // The post for one channel: its links carry the channel's mark (G55, docs/116).
  readonly render: (
    trip: Trip,
    places: ReadonlyMap<string, Place>,
    now: number,
    channel: string,
  ) => { readonly text: string; readonly markup: object; readonly remove?: boolean };
  readonly now: () => number;
  readonly send: (jobs: readonly NotificationJob[]) => Promise<void>;
};
