// A part of a map file (G22): the map library asks for the bytes it needs, never the whole file.
export type ByteRange = { readonly offset: number; readonly length: number };

// One tile or directory is far smaller: a bigger ask is refused, the Worker never reads megabytes.
const MAX_RANGE_BYTES = 2 * 1024 * 1024;
const RANGE = /^bytes=(\d+)-(\d+)$/u;

// "bytes=0-16383" → the first 16 KB. No header: null. Anything else, or too big: 'invalid'.
export function parseRange(header: string | undefined): ByteRange | 'invalid' | null {
  if (header === undefined) return null;
  const match = RANGE.exec(header.trim());
  if (!match) return 'invalid';
  const offset = Number(match[1]);
  const length = Number(match[2]) - offset + 1;
  return length > 0 && length <= MAX_RANGE_BYTES ? { offset, length } : 'invalid';
}
