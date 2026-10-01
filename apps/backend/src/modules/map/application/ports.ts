import type { FoundPlace, PlaceKind, Point } from '@platform/contracts';
import type { ByteRange } from '../domain/byte-range';

// The bytes of a map file (G22): the part asked for, where it starts and the size of the whole file.
export type MapPart = {
  readonly bytes: ArrayBuffer;
  readonly offset: number;
  readonly size: number;
  readonly etag: string;
  readonly type: string;
};

// The files in R2: the archive and the fonts. A range reads a part; no range reads a small file.
export type MapFiles = { read(key: string, range: ByteRange | null): Promise<MapPart | null> };

// The edge cache: a part read once is not read from R2 again in this place of the network.
export type MapCache = {
  match(key: string): Promise<MapPart | null>;
  put(key: string, part: MapPart): Promise<void>;
};

export type MapDeps = { readonly files: MapFiles; readonly cache: MapCache };

// What the index is asked (G23): every word must start a word of the place; only in the cells when
// there are cells; only in these districts when there are districts (G26); nearest to the point
// first when there is a point, else the shortest names.
export type PlaceQuery = {
  readonly words: readonly string[];
  readonly cells: readonly string[] | null;
  readonly near: Point | null;
  readonly districts: readonly string[] | null;
};
// What is around a point (G24): places of these kinds in these cells, nearest first. Fine cells
// (about 1 km) for landmarks, mahallas and streets; quarter cells for settlements (3 km).
type AroundQuery = {
  readonly cells: { readonly column: 'fine' | 'cell'; readonly list: readonly string[] };
  readonly kinds: readonly PlaceKind[];
  readonly near: Point;
};
export type PlaceIndex = {
  find(query: PlaceQuery, limit: number): Promise<FoundPlace[]>;
  around(query: AroundQuery, limit: number): Promise<FoundPlace[]>;
};
