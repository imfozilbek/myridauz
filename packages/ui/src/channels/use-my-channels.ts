import type { BrandChannel } from '@platform/brands';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useLoad } from '../market/use-list';
import type { PlaceDirectory } from '../places/directory';
import { regionOf } from '../way/way-end';

// The link the app opens: «Rida ilovasi», so Telegram counts who joined from the app (docs/176).
export type MyChannel = { readonly channel: BrandChannel; readonly member: boolean; readonly link: string };

// The channels of the brand that are made in Telegram (OPS-02), in the order of the brand, each with
// «✓ Aʼzosiz» when the person is in it (docs/119). «Profil», «Kanallar» and the cards of the channels
// share what came last.
export function useMyChannels() {
  const { channels } = useApiClients();
  const brand = useBrand();
  return useLoad(async (): Promise<readonly MyChannel[]> => {
    const mine = new Map((await channels.mine()).map((item) => [item.chat, item]));
    return brand.channels.flatMap((channel) => {
      const item = mine.get(channel.chat);
      return item ? [{ channel, member: item.member, link: item.link }] : [];
    });
  }, 'channels.mine');
}

// The link a card of a channel opens: «Rida ilovasi» once the server gave it, the link of the brand
// before it came or when it did not.
export function useChannelLink(channel: BrandChannel) {
  const { value } = useMyChannels();
  return value?.find((mine) => mine.channel.chat === channel.chat)?.link ?? channel.link;
}

// The region of a channel: its drawing and its header in «Barcha kanallar».
export function channelRegion(directory: PlaceDirectory, channel: BrandChannel) {
  const [first] = channel.places;
  const place = first === undefined ? undefined : directory.find(first);
  return place ? directory.find(regionOf(place)) : undefined;
}
