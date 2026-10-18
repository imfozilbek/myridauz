import type { Arrival } from '@platform/contracts';
import { messageVia, rememberedVia, startParam, startVia } from './launch-param';

// The kind of the link (find, trip, sub ...) or «direct» without one (docs/89 S3).
const KIND = /^[a-z]{1,16}(?=_|$)/u;
const DIRECT = 'direct';

// Where the person came from and on what (G55, docs/116): the kind of the link, the mark of its
// source and the Telegram app with its engine. Only marks and names, never the ids of the link.
export function launchArrival(client: string): Arrival {
  const start = startParam();
  const via = startVia() ?? rememberedVia();
  const source = start === null ? DIRECT : (KIND.exec(start)?.[0] ?? 'other');
  return { source, ...(via ? { via } : {}), client };
}

// The first screen of a session also tells a tap on a bot message (G87 V4, docs/116). The first touch
// of a person (the registration) never takes it: a bot message is not where a person came from.
export function sessionArrival(client: string): Arrival {
  const arrival = launchArrival(client);
  const message = arrival.via ? null : messageVia();
  return message ? { ...arrival, via: message } : arrival;
}
