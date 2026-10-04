import {
  CAR_PHOTO_KINDS,
  carSchema,
  DRIVER_APPLICATION_PATH,
  MAX_AVATAR_BYTES,
  type CarPhotoKind,
} from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../../env';
import { myApplication, myCarPhoto, submitApplication, uploadCarPhoto } from '../application/apply';
import type { DriversDeps } from '../application/ports';
import { fail, image } from './respond';
import { readCapped } from '../../../shared/upload/read-capped';

const PHOTO_PATH = `${DRIVER_APPLICATION_PATH}/photos/:kind`;
const isKind = (value: string): value is CarPhotoKind =>
  (CAR_PHOTO_KINDS as readonly string[]).includes(value);

// The applicant works only with their own application (docs/04).
export function driverRoutes(deps: (env: Bindings) => DriversDeps) {
  return new Hono<AppEnv>()
    .get(DRIVER_APPLICATION_PATH, async (context) =>
      context.json({ application: await myApplication(deps(context.env), context.get('session').user.id) }),
    )
    .post(DRIVER_APPLICATION_PATH, async (context) => {
      const car = carSchema.safeParse(await context.req.json().catch(() => null));
      if (!car.success) return fail(context, 'drivers.invalid_input');
      const result = await submitApplication(deps(context.env), context.get('session').user.id, car.data);
      return result.ok ? context.json({ application: result.value }) : fail(context, result.error);
    })
    .put(PHOTO_PATH, async (context) => {
      const kind = context.req.param('kind');
      if (!isKind(kind)) return fail(context, 'drivers.invalid_input');
      const bytes = await readCapped(context.req.raw, MAX_AVATAR_BYTES);
      if (!bytes) return fail(context, 'drivers.photo_too_large');
      const body = { body: bytes, type: context.req.header('content-type') ?? '' };
      const result = await uploadCarPhoto(deps(context.env), context.get('session').user.id, kind, body);
      return result.ok ? context.json({ application: result.value }) : fail(context, result.error);
    })
    .get(PHOTO_PATH, async (context) => {
      const kind = context.req.param('kind');
      if (!isKind(kind)) return fail(context, 'drivers.invalid_input');
      return image(context, await myCarPhoto(deps(context.env), context.get('session').user.id, kind));
    });
}
