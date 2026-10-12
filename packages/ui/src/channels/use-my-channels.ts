import type { BrandChannel } from '@platform/brands';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useLoad } from '../market/use-list';
import type { PlaceDirectory } from '../places/directory';
import { regionOf } from '../way/way-end';

export type MyChannel = { readonly channel: BrandChannel; readonly member: boolean };

// The channels of the brand that are made in Telegram (OPS-02), in the order of the brand, each with
// «✓ Aʼzosiz» when the person is in it (docs/119). «Profil» and «Kanallar» share what came last.
export function useMyChannels() {
  const { channels } = useApiClients();
  const brand = useBrand();
  return useLoad(async (): Promise<readonly MyChannel[]> => {
    const member = new Map((await channels.mine()).map((mine) => [mine.chat, mine.member]));
    return brand.channels.flatMap((channel) => {
      const state = member.get(channel.chat);
      return state === undefined ? [] : [{ channel, member: state }];
    });
  }, 'channels.mine');
}

// The region of a channel: its drawing and its header in «Barcha kanallar».
export function channelRegion(directory: PlaceDirectory, channel: BrandChannel) {
  const [first] = channel.places;
  const place = first === undefined ? undefined : directory.find(first);
  return place ? directory.find(regionOf(place)) : undefined;
}

// The short name of a channel: the first place of its title, or the second when the first is a big
// town the channel only passes (docs/176), so the channels from Qoʻqon read Bagʻdod, Dangʻara …
export function channelName(channel: BrandChannel) {
  const parts = channel.title.split(', ');
  return (channel.hubs ? parts[1] : parts[0]) ?? channel.title;
}
