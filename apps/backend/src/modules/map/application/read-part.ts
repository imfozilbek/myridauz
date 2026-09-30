import type { ByteRange } from '../domain/byte-range';
import type { MapDeps, MapPart } from './ports';

// A map file name never changes its bytes (a new archive gets a new name), so a cached part
// stays right for as long as it is kept.
const cacheKey = (key: string, range: ByteRange | null) =>
  range ? `${key}?bytes=${range.offset}-${range.offset + range.length - 1}` : key;

export async function readPart(deps: MapDeps, key: string, range: ByteRange | null): Promise<MapPart | null> {
  const cached = await deps.cache.match(cacheKey(key, range));
  if (cached) return cached;
  const part = await deps.files.read(key, range);
  if (part) await deps.cache.put(cacheKey(key, range), part);
  return part;
}
