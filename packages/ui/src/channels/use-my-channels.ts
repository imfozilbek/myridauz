import type { BrandChannel } from '@platform/brands';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useLoad } from '../market/use-list';
import type { PlaceDirectory } from '../places/directory';
import { regionOf } from '../way/way-end';

export type MyChannel = { readonly channel: BrandChannel; readonly member: boolean };

// The channels of the brand that are made in Telegram (OPS-02), in the order of the zones, each with
// «✓ Aʼzosiz» when the person is in it (docs/119). «Profil» and «Kanallar» share what came last.
export function useMyChannels() {
  const { channels } = useApiClients();
  const brand = useBrand();
  return useLoad(async (): Promise<readonly MyChannel[]> => {
    const member = new Map((await channels.mine()).map((mine) => [mine.username, mine.member]));
    return brand.channels.flatMap((channel) => {
      const state = member.get(channel.username);
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
