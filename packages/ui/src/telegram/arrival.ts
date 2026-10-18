import { SOURCE_BOT, SOURCE_DIRECT, type Arrival } from '@platform/contracts';
import { botMessageVia, rememberedVia, startParam, startVia } from './launch-param';

// The kind of the link (find, trip, sub ...) or «direct» without one (docs/89 S3).
const KIND = /^[a-z]{1,16}(?=_|$)/u;

// Where the person came from and on what (G55, docs/116): the kind of the link, the mark of its
// source and the Telegram app with its engine. Only marks and names, never the ids of the link.
export function launchArrival(client: string): Arrival {
  const start = startParam();
  const via = startVia() ?? rememberedVia();
  const source = start === null ? SOURCE_DIRECT : (KIND.exec(start)?.[0] ?? 'other');
  return { source, ...(via ? { via } : {}), client };
}

// The first screen of a session also tells an open from a message of a bot from one from the menu
// (G87, docs/191): «bot» and the kind of the button. The first touch of a person stays launchArrival.
export function sessionArrival(client: string): Arrival {
  const arrival = launchArrival(client);
  const bot = botMessageVia();
  return arrival.source === SOURCE_DIRECT && bot ? { source: SOURCE_BOT, via: bot, client } : arrival;
}
