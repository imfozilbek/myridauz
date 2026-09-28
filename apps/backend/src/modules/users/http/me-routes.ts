import {
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
import { getMe, type UserSettings } from '../application/get-me';
import type { UsersDeps } from '../application/ports';
import { setWriteAccess } from '../application/profile';
import { register } from '../application/register';
import { callerOf, fail } from './respond';

// The contact is shared a moment before the form is sent: an hour is plenty.
const CONTACT_MAX_AGE_SECONDS = 60 * 60;
const CREATED = 201;
const NO_CONTENT = 204;

type Wiring = {
  readonly deps: (env: Bindings) => UsersDeps;
  readonly settings: (env: Bindings) => UserSettings;
};

export function meRoutes({ deps, settings }: Wiring) {
  return new Hono<AppEnv>()
    .get(ME_PATH, async (context) =>
      context.json(await getMe(deps(context.env), callerOf(context), settings(context.env))),
    )
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
      return context.json(await getMe(usersDeps, callerOf(context), settings(context.env)), CREATED);
    })
    .put(MY_AVATAR_PATH, async (context) => {
      if (Number(context.req.header('content-length') ?? 0) > MAX_AVATAR_BYTES) {
        return fail(context, 'users.avatar_too_large');
      }
      const image = { body: await context.req.arrayBuffer(), type: context.req.header('content-type') ?? '' };
      const result = await setAvatar(deps(context.env), callerOf(context), image);
      return result.ok ? context.body(null, NO_CONTENT) : fail(context, result.error);
    })
    .post(WRITE_ACCESS_PATH, async (context) => {
      const input = writeAccessSchema.safeParse(await context.req.json().catch(() => null));
      if (!input.success) return fail(context, 'users.invalid_input');
      const result = await setWriteAccess(deps(context.env), callerOf(context), input.data.allowed);
      return result.ok ? context.body(null, NO_CONTENT) : fail(context, result.error);
    });
}
