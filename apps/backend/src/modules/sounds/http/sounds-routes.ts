import { ADMIN_SOUNDS_PATH, PUBLIC_SOUNDS_PATH, soundChoiceSchema } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { ownerOnly } from '../../../shared/auth/owner-only';
import type { SoundsDeps } from '../application/ports';
import { pickSounds, publicSounds, soundsState } from '../application/sounds';

const BAD_REQUEST = 400;
const FORBIDDEN = 403;
// A new pick of the owner reaches the Mini Apps within a minute (docs/115).
const PUBLIC_CACHE = 'public, max-age=60';

// The set in use for every Mini App without a signature; the admin screen and the pick for the team.
export function soundsRoutes(deps: (env: Bindings) => SoundsDeps) {
  return (
    new Hono<AppEnv>()
      .get(PUBLIC_SOUNDS_PATH, async (context) => {
        context.header('cache-control', PUBLIC_CACHE);
        return context.json(await publicSounds(deps(context.env)));
      })
      .use(ADMIN_SOUNDS_PATH, async (context, next) =>
        context.get('session').isAdmin ? next() : context.json({ error: 'auth.not_admin' }, FORBIDDEN),
      )
      // The sounds are the owner's, reading too (docs/120, G75).
      .use(ADMIN_SOUNDS_PATH, ownerOnly)
      .get(ADMIN_SOUNDS_PATH, async (context) => {
        const canEdit = context.get('session').teamRole === 'owner';
        return context.json(await soundsState(deps(context.env), canEdit));
      })
      .post(ADMIN_SOUNDS_PATH, async (context) => {
        const input = soundChoiceSchema.safeParse(await context.req.json().catch(() => null));
        const state = input.success
          ? await pickSounds(deps(context.env), input.data.set, context.get('session').user.id)
          : null;
        return state ? context.json(state) : context.json({ error: 'sounds.unknown_set' }, BAD_REQUEST);
      })
  );
}
