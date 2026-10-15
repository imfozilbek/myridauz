import {
  MAX_STORY_BYTES,
  MOMENT_CARD_PATH,
  MOMENT_OFFERED_PATH,
  MOMENT_PATH,
  MOMENT_STORY_PATH,
  QR_PICTURE_PATH,
  LOOP_CARD_PATH,
  loopCardSchema,
  momentCardSchema,
  momentOfferedSchema,
  momentQuerySchema,
  MY_GROWTH_PATH,
  storyImagePath,
  type ApiErrorCode,
} from '@platform/contracts';
import { Hono, type Context } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { readCapped } from '../../../shared/upload/read-capped';
import { momentCard, myGrowth, offerMoment, type CardDeps } from '../application/cards';
import { loopCard, type LoopDeps } from '../application/loop-cards';
import { savePicture, type PictureKind, type StoryDeps } from '../application/pictures';
import { dueMoment } from '../application/moments';

const STATUS = {
  'growth.not_found': 404,
  'growth.invalid_input': 400,
  'growth.invalid_image': 400,
  'growth.unavailable': 503,
} as const satisfies Partial<Record<ApiErrorCode, number>>;
const fail = (code: keyof typeof STATUS) => Response.json({ error: code }, { status: STATUS[code] });

export type Wiring = CardDeps & StoryDeps & LoopDeps;
type Handler = (context: Context<AppEnv>, wiring: Wiring, userId: number) => Promise<Response>;

// The loops of growth of a person (G69, docs/123): the moment due, its card for a chat and a story,
// and what came of the links. They live in D1 only: without it they are not there (local runs).
export function growthRoutes(deps: (env: Bindings) => Wiring | null) {
  const on = (handler: Handler) => async (context: Context<AppEnv>) => {
    const wiring = deps(context.env);
    return wiring ? handler(context, wiring, context.get('session').user.id) : fail('growth.unavailable');
  };
  return new Hono<AppEnv>()
    .get(
      MY_GROWTH_PATH,
      on(async (context, wiring, userId) => context.json(await myGrowth(wiring, userId))),
    )
    .get(
      MOMENT_PATH,
      on(async (context, wiring, userId) => {
        const query = momentQuerySchema.safeParse({ side: context.req.query('side') });
        if (!query.success) return fail('growth.invalid_input');
        return context.json(await dueMoment(wiring, userId, query.data.side));
      }),
    )
    .post(
      MOMENT_OFFERED_PATH,
      on(async (context, wiring, userId) => {
        const input = momentOfferedSchema.safeParse(await context.req.json().catch(() => null));
        if (!input.success) return fail('growth.invalid_input');
        await offerMoment(wiring, userId, input.data.moment);
        return context.body(null, 204);
      }),
    )
    .post(
      MOMENT_CARD_PATH,
      on(async (context, wiring, userId) => {
        const input = momentCardSchema.safeParse(await context.req.json().catch(() => null));
        if (!input.success) return fail('growth.invalid_input');
        const card = await momentCard(wiring, userId, input.data.moment, input.data.phrase);
        return card ? context.json(card) : fail('growth.not_found');
      }),
    )
    .post(
      LOOP_CARD_PATH,
      on(async (context, wiring, userId) => {
        const input = loopCardSchema.safeParse(await context.req.json().catch(() => null));
        if (!input.success) return fail('growth.invalid_input');
        const card = await loopCard(wiring, userId, input.data);
        return card ? context.json(card) : fail('growth.not_found');
      }),
    )
    .put(MOMENT_STORY_PATH, on(picture('moment')))
    .put(QR_PICTURE_PATH, on(picture('qr')));
}

// The picture of a story or of the QR (docs/123): its public link for Telegram.
const picture =
  (kind: PictureKind): Handler =>
  async (context, wiring, userId) => {
    const body = await readCapped(context.req.raw, MAX_STORY_BYTES);
    if (!body) return fail('growth.invalid_image');
    const image = { body, type: context.req.header('content-type') ?? '' };
    const saved = await savePicture(wiring, userId, kind, image);
    if (!saved.ok) return fail(saved.error);
    return context.json({ imageUrl: `${new URL(context.req.url).origin}${storyImagePath(saved.id)}` }, 201);
  };
