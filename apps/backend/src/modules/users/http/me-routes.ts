import {
  type Arrival,
  ME_PATH,
  MY_AVATAR_PATH,
  MAX_AVATAR_BYTES,
  REGISTRATION_PATH,
  registrationSchema,
  WRITE_ACCESS_PATH,
  writeAccessSchema,
} from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { readTelegramContact } from '../../../shared/auth/telegram-fields';
import { verifySignedParams } from '../../../shared/auth/verify-signed-params';
import { setAvatar } from '../application/avatar';
import { deleteAccount, type Forget } from '../application/delete-account';
import { getMe } from '../application/get-me';
import type { UsersDeps } from '../application/ports';
import { setWriteAccess } from '../application/profile';
import { register } from '../application/register';
import { callerOf, fail } from './respond';
import { readCapped } from '../../../shared/upload/read-capped';

// The contact is shared a moment before the form is sent: an hour is plenty.
const CONTACT_MAX_AGE_SECONDS = 60 * 60;
const CREATED = 201;
const NO_CONTENT = 204;

// After the registration: the channel of the zone the person came from (docs/119).
export type Registered = (userId: number, came: Arrival | undefined) => Promise<void>;

type Wiring = {
  readonly deps: (env: Bindings) => UsersDeps;
  readonly forget: (env: Bindings) => Forget;
  readonly registered: (env: Bindings) => Registered;
};

export function meRoutes({ deps, forget, registered }: Wiring) {
  return (
    new Hono<AppEnv>()
      .get(ME_PATH, async (context) => context.json(await getMe(deps(context.env), callerOf(context))))
      // "Maʼlumotlarimni oʻchirish" (docs/30).
      .delete(ME_PATH, async (context) => {
        const deleted = await deleteAccount(deps(context.env), forget(context.env), callerOf(context));
        return deleted ? context.body(null, NO_CONTENT) : fail(context, 'users.not_registered');
      })
      .post(REGISTRATION_PATH, async (context) => {
        const input = registrationSchema.safeParse(await context.req.json().catch(() => null));
        if (!input.success) return fail(context, 'users.invalid_input');
        const usersDeps = deps(context.env);
        const signed = await verifySignedParams(input.data.contact, {
          botToken: context.get('session').botToken,
          now: usersDeps.now(),
          maxAgeSeconds: CONTACT_MAX_AGE_SECONDS,
        });
        const contact = signed.ok ? readTelegramContact(signed.fields) : undefined;
        if (!contact) return fail(context, 'users.invalid_contact');
        const result = await register(usersDeps, callerOf(context), { ...input.data, contact });
        if (!result.ok) return fail(context, result.error);
        await registered(context.env)(result.user.id, input.data.came);
        return context.json(await getMe(usersDeps, callerOf(context)), CREATED);
      })
      .put(MY_AVATAR_PATH, async (context) => {
        const body = await readCapped(context.req.raw, MAX_AVATAR_BYTES);
        if (!body) return fail(context, 'users.avatar_too_large');
        const image = { body, type: context.req.header('content-type') ?? '' };
        const result = await setAvatar(deps(context.env), callerOf(context), image);
        return result.ok ? context.body(null, NO_CONTENT) : fail(context, result.error);
      })
      .post(WRITE_ACCESS_PATH, async (context) => {
        const input = writeAccessSchema.safeParse(await context.req.json().catch(() => null));
        if (!input.success) return fail(context, 'users.invalid_input');
        const result = await setWriteAccess(deps(context.env), callerOf(context), input.data.allowed);
        return result.ok ? context.body(null, NO_CONTENT) : fail(context, result.error);
      })
  );
}
