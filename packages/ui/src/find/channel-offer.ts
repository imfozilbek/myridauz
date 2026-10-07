import { channelOf, type BrandChannel } from '@platform/brands';
import { useState } from 'react';
import { useBrand } from '../context/brand-context';
import type { PlaceDirectory } from '../places/directory';
import type { Route } from '../places/route-screen';

// One direction is offered once (docs/119): joined or closed in one place, the card is gone in all.
const KEY = 'channel_offered';

function offered(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function remember(username: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...offered(), username]));
  } catch {
    // No storage on this phone: the card comes again next time.
  }
}

// The channel of the other end of the trip (docs/119): the zone of the place, or of a place of the
// region when the search is a whole region. Tashkent has no channel (docs/15).
export function useChannelOffer(route: Route, directory: PlaceDirectory) {
  const brand = useBrand();
  const { to } = route;
  const places = to.parentId === null ? directory.inside(to.id).map((place) => place.id) : [to.id];
  const found = channelOf(brand, ...places);
  const [hidden, setHidden] = useState(() => (found ? offered().includes(found.username) : true));
  const close = () => {
    if (found) remember(found.username);
    setHidden(true);
  };
  return { channel: hidden ? null : (found ?? null), close } satisfies {
    channel: BrandChannel | null;
    close: () => void;
  };
}
