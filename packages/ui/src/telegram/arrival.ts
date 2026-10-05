import type { Arrival } from '@platform/contracts';
import { startParam, startVia } from './launch-param';

// The kind of the link (find, trip, sub ...) or «direct» without one (docs/89 S3).
const KIND = /^[a-z]{1,16}(?=_|$)/u;
const DIRECT = 'direct';

// Where the person came from and on what (G55, docs/116): the kind of the link, the mark of its
// source and the Telegram app with its engine. Only marks and names, never the ids of the link.
export function launchArrival(client: string): Arrival {
  const start = startParam();
  const via = startVia();
  const source = start === null ? DIRECT : (KIND.exec(start)?.[0] ?? 'other');
  return { source, ...(via ? { via } : {}), client };
}
