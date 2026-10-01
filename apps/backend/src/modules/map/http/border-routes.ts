import { mapBorderPath } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv } from '../../../env';
import type { Border } from '../domain/borders';

const NOT_FOUND = 404;
// The borders change only with a new release: a day on the phone.
const KEEP_ON_PHONE = 'private, max-age=86400';

// The border of a district for the map of the district (G24, docs/71): the map is cut by it.
// A region (Toshkent shahri) is all its districts: the map of a booking there is the whole city (G26).
export function borderRoutes(
  borders: () => readonly Border[],
  districtsOf: (id: string) => readonly string[] | null,
) {
  return new Hono<AppEnv>().get(mapBorderPath(':id'), (context) => {
    const id = context.req.param('id') ?? '';
    const ids = districtsOf(id) ?? [id];
    const found = borders().filter((each) => ids.includes(each.id));
    if (found.length === 0) return context.json({ error: 'locations.not_found' }, NOT_FOUND);
    context.header('cache-control', KEEP_ON_PHONE);
    return context.json({ id, parts: found.flatMap((border) => border.parts) });
  });
}
