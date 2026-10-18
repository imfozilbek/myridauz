import { BOT_VIA_PREFIX, ENTRIES, type Entries, type Entry } from '@platform/contracts';

// The first screens of the sessions of one way in (G87 V4, docs/116).
export type EntryCount = { readonly entry: string; readonly count: number };

const DIRECT = 'direct';
const isEntry = (entry: string): entry is Entry => (ENTRIES as readonly string[]).includes(entry);

// The way in of a first screen: the mark of a bot message, no link and no mark, or a link. source:
// the kind of the link, «direct» without one; via: its mark.
export const entryOf = (source: string, via: string): Entry =>
  via.startsWith(BOT_VIA_PREFIX) ? 'bot' : source === DIRECT && via === '' ? DIRECT : 'link';

// How the sessions of a period began: an odd row left out.
export function entriesOf(rows: readonly EntryCount[]): Entries {
  const entries = { bot: 0, direct: 0, link: 0 };
  for (const { entry, count } of rows) if (isEntry(entry)) entries[entry] += count;
  return entries;
}
