import type { BrandChannel, BrandConfig } from './brand-config';

// The own channel of a place (docs/176): a channel that names it, not one that only passes it.
// A place every channel of which only passes it (Sherobod) takes the first of those.
const ownOf = (channels: readonly BrandChannel[], place: string) => {
  const all = channels.filter((channel) => channel.places.includes(place));
  return all.find((channel) => !channel.hubs?.includes(place)) ?? all[0];
};

// The channel of a person's place: the first place that has one (docs/63, docs/119).
export const channelOf = (brand: BrandConfig, ...places: readonly string[]) =>
  places.map((place) => ownOf(brand.channels, place)).find(Boolean);

// A direction kept in a group (docs/222) takes the trip posts only: its name, avatar, welcome and pin
// are the group's own and it gets no board of the day.
export const channelsOnly = (brand: BrandConfig) => brand.channels.filter((channel) => !channel.group);

export const groupChats = (brand: BrandConfig) =>
  new Set(brand.channels.filter((channel) => channel.group).map(({ chat }) => chat));
