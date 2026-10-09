import { matchesPlace, type Location } from '@platform/contracts';
import type { PlaceDirectory } from '../places/directory';
import { channelRegion, type MyChannel } from './use-my-channels';

export type RegionGroup = { readonly region: Location; readonly channels: readonly MyChannel[] };

// A channel is found by its own name, by its region or by any place it covers: «Viloyat yoki shahar».
export function matchesChannel(directory: PlaceDirectory, mine: MyChannel, query: string) {
  const names = [
    mine.channel.title,
    channelRegion(directory, mine.channel)?.name ?? '',
    ...mine.channel.places.map((id) => directory.find(id)?.name ?? ''),
  ];
  return names.some((name) => name !== '' && matchesPlace(name, query));
}

// «Barcha kanallar» under the names of their regions, in the order of the zones of the brand.
export function byRegion(directory: PlaceDirectory, channels: readonly MyChannel[]): RegionGroup[] {
  const groups = new Map<string, { region: Location; channels: MyChannel[] }>();
  for (const mine of channels) {
    const region = channelRegion(directory, mine.channel);
    if (!region) continue;
    const group = groups.get(region.id) ?? { region, channels: [] };
    group.channels.push(mine);
    groups.set(region.id, group);
  }
  return [...groups.values()];
}
