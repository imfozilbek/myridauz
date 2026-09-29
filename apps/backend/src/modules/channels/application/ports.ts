import type { Trip } from '@platform/contracts';
import type { NotificationJob } from '../../notifications';

// The message id of each channel post of a trip, to edit it later (docs/15).
export type ChannelPost = { readonly tripId: string; readonly channel: string; readonly messageId: number };
export type ChannelPostStore = {
  save(post: ChannelPost): Promise<void>;
  byTrip(tripId: string): Promise<ChannelPost[]>;
};

type Place = { readonly name: string; readonly parentId: string | null };

export type ChannelsDeps = {
  // Autoposting starts only when the owner switches it on (docs/33, public action).
  readonly enabled: boolean;
  readonly channels: Readonly<Record<string, string>>;
  readonly places: () => Promise<ReadonlyMap<string, Place>>;
  readonly trip: (id: string) => Promise<Trip | undefined>;
  readonly posts: ChannelPostStore;
  readonly render: (trip: Trip, places: ReadonlyMap<string, Place>) => { text: string; markup?: object };
  readonly send: (jobs: readonly NotificationJob[]) => Promise<void>;
};
