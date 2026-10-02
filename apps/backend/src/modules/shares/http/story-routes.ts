import { LINK_ID, MAX_STORY_BYTES, storyImagePath, type Story } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { readStory, saveStory, type StoriesDeps } from '../application/stories';

const STATUS = { 'shares.not_found': 404, 'shares.wrong_status': 409, 'shares.invalid_image': 400 } as const;
// Telegram reads the picture once when the story is posted; a day of cache is enough.
const CACHE = 'public, max-age=86400';

type Wiring = StoriesDeps & { readonly bookLink: (tripId: string) => string };

// «Hikoyaga joylash» (docs/88 L19): the driver uploads the picture; Telegram reads it without a signature.
export function storyRoutes(deps: (env: Bindings) => Wiring) {
  const fail = (code: keyof typeof STATUS) => Response.json({ error: code }, { status: STATUS[code] });
  return new Hono<AppEnv>()
    .put('/driver/trips/:id/story', async (context) => {
      if (Number(context.req.header('content-length') ?? 0) > MAX_STORY_BYTES)
        return fail('shares.invalid_image');
      const tripId = context.req.param('id');
      const wiring = deps(context.env);
      const image = { body: await context.req.arrayBuffer(), type: context.req.header('content-type') ?? '' };
      const result = await saveStory(wiring, context.get('session').user.id, tripId, image);
      if (!result.ok) return fail(result.error);
      // The time in the link: Telegram never takes an older picture of the same trip from a cache.
      const imageUrl = `${new URL(context.req.url).origin}${storyImagePath(tripId)}?v=${Date.now()}`;
      return context.json({ imageUrl, bookLink: wiring.bookLink(tripId) } satisfies Story, 201);
    })
    .get('/stories/:id', async (context) => {
      const tripId = context.req.param('id');
      const image = LINK_ID.test(tripId) ? await readStory(deps(context.env), tripId) : undefined;
      if (!image) return fail('shares.not_found');
      return context.body(image.body, 200, { 'content-type': image.type, 'cache-control': CACHE });
    });
}
