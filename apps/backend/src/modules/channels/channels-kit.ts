import type { Trip } from '@platform/contracts';
import type { NotificationJob } from '../notifications';
import type { ChannelsDeps } from './application/ports';
import { createMemoryChannelPosts } from './infrastructure/channel-posts';
import { channelPost } from './infrastructure/post-text';
import { CHANNELS, PLACES, TRIP } from './channels-fixtures';

// Test helper: the channels of a trip with a clock and a trip that changes (docs/15).
// Before the trip leaves (TRIP departs 2.10.2026 08:30 in Tashkent).
export const BEFORE = Date.parse('2026-10-01T00:00:00Z');

export function setup(trip: Trip = TRIP, enabled = true) {
  let now = trip;
  let clock = BEFORE;
  const sent: NotificationJob[] = [];
  const deps: ChannelsDeps = {
    enabled,
    channels: async () => CHANNELS,
    places: async () => PLACES,
    trip: async (id) => (id === now.id ? now : undefined),
    posts: createMemoryChannelPosts(),
    render: channelPost('test_bot'),
    send: async (jobs) => void sent.push(...jobs),
    now: () => clock,
  };
  const change = (next: Partial<Trip>) => void (now = { ...now, ...next });
  return { deps, sent, change, later: (ms: number) => void (clock = ms) };
}
