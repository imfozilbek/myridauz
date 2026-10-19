import { readFileSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';

// The signs a woff2 file draws (G73): its cmap, read the way a browser reads it. WOFF2 keeps every
// table in one Brotli stream after the table directory; cmap is the known tag 0 and never transformed.
const HEADER_BYTES = 48;
const TAG_MASK = 0x3f;
const OWN_TAG = 0x3f;
const GLYF_LOCA = new Set([10, 11]);
const CMAP = 0;
const UNICODE_BMP = 4;

type Cursor = { at: number };

function base128(bytes: Uint8Array, cursor: Cursor): number {
  let value = 0;
  for (;;) {
    const byte = bytes[cursor.at++] ?? 0;
    value = value * 128 + (byte & 0x7f);
    if ((byte & 0x80) === 0) return value;
  }
}

// The cmap table out of the decompressed stream: the tables lie one after another, no padding.
function cmapTable(file: Buffer): DataView {
  const view = new DataView(file.buffer, file.byteOffset, file.byteLength);
  const cursor = { at: HEADER_BYTES };
  let start = 0;
  let found: { start: number; length: number } | null = null;
  for (let table = 0; table < view.getUint16(12); table++) {
    const flags = file[cursor.at++] ?? 0;
    if ((flags & TAG_MASK) === OWN_TAG) cursor.at += 4;
    const length = base128(file, cursor);
    const version = flags >> 6;
    const transformed = GLYF_LOCA.has(flags & TAG_MASK) ? version === 0 : version !== 0;
    const stored = transformed ? base128(file, cursor) : length;
    if ((flags & TAG_MASK) === CMAP) found = { start, length };
    start += stored;
  }
  if (!found) throw new Error('font: no cmap');
  const data = brotliDecompressSync(file.subarray(cursor.at, cursor.at + view.getUint32(20)));
  return new DataView(data.buffer, data.byteOffset + found.start, found.length);
}

// Format 4 of the Unicode BMP: segments of codes, each code drawn when its glyph is not 0.
function format4(cmap: DataView, at: number): Set<number> {
  const segments = cmap.getUint16(at + 6) / 2;
  const ends = at + 14;
  const starts = ends + segments * 2 + 2;
  const deltas = starts + segments * 2;
  const offsets = deltas + segments * 2;
  const signs = new Set<number>();
  for (let segment = 0; segment < segments; segment++) {
    const [end, first] = [cmap.getUint16(ends + segment * 2), cmap.getUint16(starts + segment * 2)];
    const delta = cmap.getInt16(deltas + segment * 2);
    const rangeAt = offsets + segment * 2;
    const range = cmap.getUint16(rangeAt);
    for (let code = first; code <= end && code !== 0xffff; code++) {
      const raw = range === 0 ? code : cmap.getUint16(rangeAt + range + (code - first) * 2);
      if (raw !== 0 && (raw + delta) % 0x10000 !== 0) signs.add(code);
    }
  }
  return signs;
}

export function fontSigns(path: string): Set<number> {
  const cmap = cmapTable(readFileSync(path));
  for (let record = 0; record < cmap.getUint16(2); record++) {
    const at = cmap.getUint32(4 + record * 8 + 4);
    if (cmap.getUint16(at) === UNICODE_BMP) return format4(cmap, at);
  }
  throw new Error('font: no BMP cmap');
}
